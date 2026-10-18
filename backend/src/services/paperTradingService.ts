import prisma from '../database/client';
import { marketDataProvider } from '../providers/MockMarketDataProvider';
import { marketIngestionService } from './marketIngestionService';
import { Prisma } from '@prisma/client';
import { memoryPortfolios, memoryUsers } from './authService';

export interface ExecuteOrderDTO {
  userId: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  executionType?: 'MARKET' | 'LIMIT';
  quantity: number;
  limitPrice?: number;
}

const memoryTransactions = new Map<string, any[]>();
const memoryPendingOrders = new Map<string, any[]>();

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

    const quote = await marketIngestionService.getLatestQuote(upperSymbol);
    if (!quote) {
      throw { statusCode: 404, message: `Market price for symbol '${upperSymbol}' not available.` };
    }

    const currentPrice = quote.price;

    // Handle Pending LIMIT Orders
    if (executionType === 'LIMIT' && limitPrice) {
      const isBuyLimitTriggered = type === 'BUY' && currentPrice <= limitPrice;
      const isSellLimitTriggered = type === 'SELL' && currentPrice >= limitPrice;

      if (!isBuyLimitTriggered && !isSellLimitTriggered) {
        // Queue as PENDING Limit Order
        const pendingOrder = {
          id: 'ord_lim_' + Date.now(),
          userId,
          symbol: upperSymbol,
          type,
          executionType: 'LIMIT',
          status: 'PENDING',
          limitPrice,
          price: limitPrice,
          quantity,
          totalAmount: limitPrice * quantity,
          createdAt: new Date().toISOString(),
        };

        const userPending = memoryPendingOrders.get(userId) || [];
        userPending.unshift(pendingOrder);
        memoryPendingOrders.set(userId, userPending);

        return {
          order: pendingOrder,
          message: `Pending ${type} LIMIT order created for ${quantity} shares of ${upperSymbol} @ $${limitPrice}.`,
        };
      }
    }

    const totalCost = Number((currentPrice * quantity).toFixed(2));

    // 1. Try PostgreSQL via Prisma
    try {
      return await prisma.$transaction(async (tx) => {
        let portfolio = await tx.portfolio.findUnique({
          where: { userId },
          include: { holdings: true },
        });

        if (!portfolio) {
          portfolio = await tx.portfolio.create({
            data: {
              userId,
              cashBalance: 100000.00,
              investedAmount: 0.00,
              realizedPnL: 0.00,
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
          const existingHolding = portfolio.holdings.find((h) => h.symbol === upperSymbol);

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
          const newInvestedAmount = updatedHoldings.reduce((sum, h) => sum + Number(h.quantity) * Number(h.averageBuyPrice), 0);

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
          const existingHolding = portfolio.holdings.find((h) => h.symbol === upperSymbol);
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
          const newInvestedAmount = updatedHoldings.reduce((sum, h) => sum + Number(h.quantity) * Number(h.averageBuyPrice), 0);
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
    } catch (err: any) {
      if (err.statusCode === 400) throw err;
    }

    // 2. In-memory fallback
    let portfolio = memoryPortfolios.get(userId);
    if (!portfolio) {
      portfolio = {
        id: 'port_' + userId,
        userId,
        cashBalance: 100000.00,
        investedAmount: 0.00,
        realizedPnL: 0.00,
        holdings: [],
      };
      memoryPortfolios.set(userId, portfolio);
    }

    const currentCash = portfolio.cashBalance;

    if (type === 'BUY') {
      if (currentCash < totalCost) {
        throw {
          statusCode: 400,
          message: `Insufficient virtual cash. Required: $${totalCost.toFixed(2)}, Available: $${currentCash.toFixed(2)}.`,
        };
      }

      const newCash = currentCash - totalCost;
      let existingHolding = portfolio.holdings.find((h: any) => h.symbol === upperSymbol);

      if (existingHolding) {
        const oldQty = existingHolding.quantity;
        const oldAvg = existingHolding.averageBuyPrice;
        const newQty = oldQty + quantity;
        const newAvgPrice = ((oldQty * oldAvg) + totalCost) / newQty;
        existingHolding.quantity = newQty;
        existingHolding.averageBuyPrice = newAvgPrice;
      } else {
        existingHolding = {
          id: 'h_' + Math.random().toString(36).substring(2, 9),
          symbol: upperSymbol,
          quantity,
          averageBuyPrice: currentPrice,
        };
        portfolio.holdings.push(existingHolding);
      }

      portfolio.cashBalance = newCash;
      portfolio.investedAmount = portfolio.holdings.reduce((sum: number, h: any) => sum + h.quantity * h.averageBuyPrice, 0);

      for (const memUser of memoryUsers.values()) {
        if (memUser.id === userId) {
          memUser.virtualCash = newCash;
        }
      }

      const txRecord = {
        id: 'tx_' + Date.now(),
        userId,
        symbol: upperSymbol,
        type: 'BUY',
        price: currentPrice,
        quantity,
        totalAmount: totalCost,
        realizedPnL: 0,
        createdAt: new Date().toISOString(),
      };

      const userTxs = memoryTransactions.get(userId) || [];
      userTxs.unshift(txRecord);
      memoryTransactions.set(userId, userTxs);

      return { transaction: txRecord, message: `Successfully bought ${quantity} shares of ${upperSymbol} @ $${currentPrice}` };

    } else {
      let existingHolding = portfolio.holdings.find((h: any) => h.symbol === upperSymbol);
      if (!existingHolding) {
        throw { statusCode: 400, message: `You do not own any shares of ${upperSymbol}.` };
      }

      if (existingHolding.quantity < quantity) {
        throw {
          statusCode: 400,
          message: `Insufficient holdings. Owned: ${existingHolding.quantity}, Attempting to sell: ${quantity}.`,
        };
      }

      const avgPrice = existingHolding.averageBuyPrice;
      const realizedPnL = Number(((currentPrice - avgPrice) * quantity).toFixed(2));

      existingHolding.quantity -= quantity;
      if (existingHolding.quantity === 0) {
        portfolio.holdings = portfolio.holdings.filter((h: any) => h.symbol !== upperSymbol);
      }

      portfolio.cashBalance += totalCost;
      portfolio.realizedPnL += realizedPnL;
      portfolio.investedAmount = portfolio.holdings.reduce((sum: number, h: any) => sum + h.quantity * h.averageBuyPrice, 0);

      for (const memUser of memoryUsers.values()) {
        if (memUser.id === userId) {
          memUser.virtualCash = portfolio.cashBalance;
        }
      }

      const txRecord = {
        id: 'tx_' + Date.now(),
        userId,
        symbol: upperSymbol,
        type: 'SELL',
        price: currentPrice,
        quantity,
        totalAmount: totalCost,
        realizedPnL,
        createdAt: new Date().toISOString(),
      };

      const userTxs = memoryTransactions.get(userId) || [];
      userTxs.unshift(txRecord);
      memoryTransactions.set(userId, userTxs);

      return { transaction: txRecord, message: `Successfully sold ${quantity} shares of ${upperSymbol} @ $${currentPrice}` };
    }
  }

  public async getPortfolioSummary(userId: string) {
    try {
      let portfolio = await prisma.portfolio.findUnique({
        where: { userId },
        include: { holdings: true },
      });

      if (portfolio) {
        const cashBalance = Number(portfolio.cashBalance);
        const realizedPnL = Number(portfolio.realizedPnL);
        let currentHoldingsValue = 0;
        let totalInvestedCost = 0;

        const holdingsWithLiveQuotes = await Promise.all(
          portfolio.holdings.map(async (h) => {
            const qty = Number(h.quantity);
            const avgBuy = Number(h.averageBuyPrice);
            const quote = await marketIngestionService.getLatestQuote(h.symbol);

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
    } catch {
      // Memory fallback
    }

    let portfolio = memoryPortfolios.get(userId);
    if (!portfolio) {
      portfolio = {
        id: 'port_' + userId,
        userId,
        cashBalance: 100000.00,
        investedAmount: 0.00,
        realizedPnL: 0.00,
        holdings: [],
      };
      memoryPortfolios.set(userId, portfolio);
    }

    const cashBalance = portfolio.cashBalance;
    const realizedPnL = portfolio.realizedPnL;
    let currentHoldingsValue = 0;
    let totalInvestedCost = 0;

    const holdingsWithLiveQuotes = await Promise.all(
      portfolio.holdings.map(async (h: any) => {
        const qty = h.quantity;
        const avgBuy = h.averageBuyPrice;
        const quote = await marketIngestionService.getLatestQuote(h.symbol);

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
    try {
      const txs = await prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      if (txs && txs.length > 0) {
        return txs.map((tx) => ({
          id: tx.id,
          symbol: tx.symbol,
          type: tx.type,
          price: Number(tx.price),
          quantity: Number(tx.quantity),
          totalAmount: Number(tx.totalAmount),
          realizedPnL: Number(tx.realizedPnL),
          createdAt: tx.createdAt,
        }));
      }
    } catch {
      // Memory fallback
    }

    return memoryTransactions.get(userId) || [];
  }

  public async getPendingOrders(userId: string) {
    return memoryPendingOrders.get(userId) || [];
  }
}

class Decimal extends Prisma.Decimal {
  constructor(v: number | string) {
    super(v);
  }
}

export const paperTradingService = new PaperTradingService();
