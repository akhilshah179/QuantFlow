import prisma from '../database/client';

export interface CreateAlertDTO {
  userId: string;
  symbol: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
}

export class AlertService {
  public async getAlertsForUser(userId: string) {
    return prisma.alert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async createAlert(dto: CreateAlertDTO) {
    return prisma.alert.create({
      data: {
        userId: dto.userId,
        symbol: dto.symbol.toUpperCase(),
        targetPrice: dto.targetPrice,
        condition: dto.condition,
      },
    });
  }

  public async deleteAlert(id: string, userId: string) {
    return prisma.alert.deleteMany({
      where: { id, userId },
    });
  }

  public async checkAlerts(symbol: string, currentPrice: number) {
    const activeAlerts = await prisma.alert.findMany({
      where: {
        symbol: symbol.toUpperCase(),
        isActive: true,
      },
    });

    for (const alert of activeAlerts) {
      const target = Number(alert.targetPrice);
      let triggered = false;

      if (alert.condition === 'ABOVE' && currentPrice >= target) {
        triggered = true;
      } else if (alert.condition === 'BELOW' && currentPrice <= target) {
        triggered = true;
      }

      if (triggered) {
        await prisma.alert.update({
          where: { id: alert.id },
          data: { isActive: false, triggeredAt: new Date() },
        });
        console.log(`[Alert Engine] Triggered alert ${alert.id} for ${symbol} @ ${currentPrice}`);
      }
    }
  }
}

export const alertService = new AlertService();
