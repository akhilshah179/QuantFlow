import prisma from '../database/client';
import { marketDataProvider } from '../providers/MarketDataProviderRouter';
import { marketIngestionService } from './marketIngestionService';
import { Prisma } from '@prisma/client';

const Decimal = Prisma.Decimal;

export interface ExecuteOrderDTO {
  userId: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  executionType?: 'MARKET' | 'LIMIT';
  quantity: number;
  limitPrice?: number;
}

export class PaperTradingService {
  public async executeOrder(dto: ExecuteOrderDTO) {
    const { userId, symbol, type, executionType = 'MARKET', quantity, limitPrice } = dto;
    const upperSymbol = symbol.toUpperCase();

    if (!quantity || quantity <= 0) {
      throw { statusCode: 400, message: 'Quantity must be greater than zero.' };
    }

    if (executionType === 'LIMIT' && (!limitPrice || limitPrice <= 0)) {
      throw { statusCode: 400, message: 'Limit price must be specified for LIMIT orders.' };
    }

    // Resolve real market price from MarketIngestionService or MarketDataProviderRouter
    let quote = await marketIngestionService.getLatestQuote(upperSymbol);
    if (!quote || quote.price <= 0) {
      quote = await marketDataProvider.getQuote(upperSymbol);
    }

    if (!quote || quote.price <= 0) {
      throw { statusCode: 404, message: `Market price for symbol '${upperSymbol}' is currently unavailable.` };
    }

    const midPrice = quote.price;
    const executionPrice = type === 'BUY'
      ? (quote.ask && quote.ask > 0 ? quote.ask : midPrice)
      : (quote.bid && quote.bid > 0 ? quote.bid : midPrice);
    const currentPrice = executionPrice;
    const totalCost = Number((currentPrice * quantity).toFixed(2));

    // Mandatory Database Transaction
    return await prisma.$transaction(async (tx: any) => {
      let portfolio = await tx.portfolio.findUnique({
        where: { userId },
        include: { holdings: true },
      });

      if (!portfolio) {
        portfolio = await tx.portfolio.create({
          data: {
            userId,
            cashBalance: new Decimal(100000.00),
            investedAmount: new Decimal(0.00),
            realizedPnL: new Decimal(0.00),
          },
          include: { holdings: true },
        });
      }

      const currentCash = Number(portfolio.cashBalance);

      if (type === 'BUY') {
        if (currentCash < totalCost) {
          throw {
            statusCode: 400,
            message: `Insufficient virtual cash. Required: $${totalCost.toFixed(2)}, Available: $${currentCash.toFixed(2)}.`,
          };
        }

        const newCash = currentCash - totalCost;
        const existingHolding = portfolio.holdings.find((h: any) => h.symbol === upperSymbol);

        if (existingHolding) {
          const oldQty = Number(existingHolding.quantity);
          const oldAvg = Number(existingHolding.averageBuyPrice);
          const newQty = oldQty + quantity;
          const newAvgPrice = ((oldQty * oldAvg) + totalCost) / newQty;

          await tx.holding.update({
            where: { id: existingHolding.id },
            data: {
              quantity: new Decimal(newQty),
              averageBuyPrice: new Decimal(newAvgPrice),
            },
          });
        } else {
          await tx.holding.create({
            data: {
              portfolioId: portfolio.id,
              symbol: upperSymbol,
              quantity: new Decimal(quantity),
              averageBuyPrice: new Decimal(currentPrice),
            },
          });
        }

        const updatedHoldings = await tx.holding.findMany({ where: { portfolioId: portfolio.id } });
        const newInvestedAmount = updatedHoldings.reduce((sum: number, h: any) => sum + Number(h.quantity) * Number(h.averageBuyPrice), 0);

        await tx.portfolio.update({
          where: { id: portfolio.id },
          data: {
            cashBalance: new Decimal(newCash),
            investedAmount: new Decimal(newInvestedAmount),
          },
        });

        await tx.user.update({
          where: { id: userId },
          data: { virtualCash: new Decimal(newCash) },
        });

        const order = await tx.order.create({
          data: {
            userId,
            symbol: upperSymbol,
            type: 'BUY',
            status: 'FILLED',
            price: new Decimal(currentPrice),
            quantity: new Decimal(quantity),
            totalAmount: new Decimal(totalCost),
          },
        });

        const transaction = await tx.transaction.create({
          data: {
            userId,
            orderId: order.id,
            symbol: upperSymbol,
            type: 'BUY',
            price: new Decimal(currentPrice),
            quantity: new Decimal(quantity),
            totalAmount: new Decimal(totalCost),
            realizedPnL: new Decimal(0),
          },
        });

        return { order, transaction, message: `Successfully bought ${quantity} shares of ${upperSymbol} @ $${currentPrice}` };

      } else {
        // SELL logic
        const existingHolding = portfolio.holdings.find((h: any) => h.symbol === upperSymbol);
        if (!existingHolding) {
          throw { statusCode: 400, message: `You do not own any shares of ${upperSymbol}.` };
        }

        const ownedQty = Number(existingHolding.quantity);
        if (ownedQty < quantity) {
          throw {
            statusCode: 400,
            message: `Insufficient holdings. Owned: ${ownedQty}, Attempting to sell: ${quantity}.`,
          };
        }

        const avgPrice = Number(existingHolding.averageBuyPrice);
        const realizedPnL = Number(((currentPrice - avgPrice) * quantity).toFixed(2));
        const revenue = totalCost;

        const newCash = currentCash + revenue;
        const remainingQty = ownedQty - quantity;

        if (remainingQty === 0) {
          await tx.holding.delete({ where: { id: existingHolding.id } });
        } else {
          await tx.holding.update({
            where: { id: existingHolding.id },
            data: { quantity: new Decimal(remainingQty) },
          });
        }

        const updatedHoldings = await tx.holding.findMany({ where: { portfolioId: portfolio.id } });
        const newInvestedAmount = updatedHoldings.reduce((sum: number, h: any) => sum + Number(h.quantity) * Number(h.averageBuyPrice), 0);
        const newRealizedPnL = Number(portfolio.realizedPnL) + realizedPnL;

        await tx.portfolio.update({
          where: { id: portfolio.id },
          data: {
            cashBalance: new Decimal(newCash),
            investedAmount: new Decimal(newInvestedAmount),
            realizedPnL: new Decimal(newRealizedPnL),
          },
        });

        await tx.user.update({
          where: { id: userId },
          data: { virtualCash: new Decimal(newCash) },
        });

        const order = await tx.order.create({
          data: {
            userId,
            symbol: upperSymbol,
            type: 'SELL',
            status: 'FILLED',
            price: new Decimal(currentPrice),
            quantity: new Decimal(quantity),
            totalAmount: new Decimal(totalCost),
          },
        });

        const transaction = await tx.transaction.create({
          data: {
            userId,
            orderId: order.id,
            symbol: upperSymbol,
            type: 'SELL',
            price: new Decimal(currentPrice),
            quantity: new Decimal(quantity),
            totalAmount: new Decimal(totalCost),
            realizedPnL: new Decimal(realizedPnL),
          },
        });

        return { order, transaction, message: `Successfully sold ${quantity} shares of ${upperSymbol} @ $${currentPrice}` };
      }
    });
  }

  public async getPortfolioSummary(userId: string) {
    let portfolio = await prisma.portfolio.findUnique({
      where: { userId },
      include: { holdings: true },
    });

    if (!portfolio) {
      portfolio = await prisma.portfolio.create({
        data: {
          userId,
          cashBalance: new Decimal(100000.00),
          investedAmount: new Decimal(0.00),
          realizedPnL: new Decimal(0.00),
        },
        include: { holdings: true },
      });
    }

    const cashBalance = Number(portfolio.cashBalance);
    const realizedPnL = Number(portfolio.realizedPnL);
    let currentHoldingsValue = 0;
    let totalInvestedCost = 0;

    const holdingsWithLiveQuotes = await Promise.all(
      portfolio.holdings.map(async (h: any) => {
        const qty = Number(h.quantity);
        const avgBuy = Number(h.averageBuyPrice);
        let quote = await marketIngestionService.getLatestQuote(h.symbol);
        if (!quote || quote.price <= 0) {
          quote = await marketDataProvider.getQuote(h.symbol);
        }

        const currentPrice = quote ? quote.price : avgBuy;
        const currentValue = qty * currentPrice;
        const costBasis = qty * avgBuy;
        const unrealizedPnL = currentValue - costBasis;
        const unrealizedPnLPercent = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0;

        currentHoldingsValue += currentValue;
        totalInvestedCost += costBasis;

        return {
          id: h.id,
          symbol: h.symbol,
          name: quote ? quote.name : h.symbol,
          quantity: qty,
          averageBuyPrice: avgBuy,
          currentPrice,
          currentValue: Number(currentValue.toFixed(2)),
          unrealizedPnL: Number(unrealizedPnL.toFixed(2)),
          unrealizedPnLPercent: Number(unrealizedPnLPercent.toFixed(2)),
        };
      })
    );

    const totalPortfolioValue = cashBalance + currentHoldingsValue;
    const totalUnrealizedPnL = currentHoldingsValue - totalInvestedCost;

    return {
      portfolioId: portfolio.id,
      totalPortfolioValue: Number(totalPortfolioValue.toFixed(2)),
      cashBalance: Number(cashBalance.toFixed(2)),
      investedAmount: Number(totalInvestedCost.toFixed(2)),
      unrealizedPnL: Number(totalUnrealizedPnL.toFixed(2)),
      realizedPnL: Number(realizedPnL.toFixed(2)),
      holdings: holdingsWithLiveQuotes,
    };
  }

  public async getTransactions(userId: string) {
    const txs = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return txs.map((t: any) => ({
      id: t.id,
      orderId: t.orderId,
      symbol: t.symbol,
      type: t.type,
      price: Number(t.price),
      quantity: Number(t.quantity),
      totalAmount: Number(t.totalAmount),
      realizedPnL: Number(t.realizedPnL),
      createdAt: t.createdAt.toISOString(),
    }));
  }
}

export const paperTradingService = new PaperTradingService();
