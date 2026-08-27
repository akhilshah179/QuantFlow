import prisma from '../database/client';

export interface CreateIdeaDTO {
  userId: string;
  symbol: string;
  title: string;
  description: string;
  chartSnapshot?: string;
}

export class CommunityService {
  public async getTradeIdeas(symbol?: string) {
    const where = symbol ? { symbol: symbol.toUpperCase() } : {};
    return prisma.tradeIdea.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        comments: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  public async createTradeIdea(dto: CreateIdeaDTO) {
    return prisma.tradeIdea.create({
      data: {
        userId: dto.userId,
        symbol: dto.symbol.toUpperCase(),
        title: dto.title,
        description: dto.description,
        chartSnapshot: dto.chartSnapshot,
      },
      include: {
        user: { select: { id: true, name: true } },
        comments: true,
      },
    });
  }

  public async likeTradeIdea(ideaId: string) {
    return prisma.tradeIdea.update({
      where: { id: ideaId },
      data: { likesCount: { increment: 1 } },
    });
  }

  public async addComment(ideaId: string, userId: string, content: string) {
    return prisma.comment.create({
      data: {
        ideaId,
        userId,
        content,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  }
}

export const communityService = new CommunityService();
