import { toNumber } from "@/features/animals/services/animalAnalyticsService";
import { feedBatchService } from "./feedBatchService";
import { feedMovementService } from "./feedMovementService";
import { feedTypeService } from "./feedTypeService";
import type { FeedInventorySummary, FeedTypeInventorySummary } from "../types/feed.types";

function getBatchRemainingQuantity(args: {
  batchId: string;
  movementByBatch: Map<string, number>;
}) {
  return args.movementByBatch.get(args.batchId) ?? 0;
}

export const feedInventoryService = {
  async getFeedTypeInventorySummary(farmId: string): Promise<FeedTypeInventorySummary[]> {
    const [feedTypes, batches, movements] = await Promise.all([
      feedTypeService.listByFarm(farmId),
      feedBatchService.listByFarm(farmId),
      feedMovementService.listByFarm(farmId),
    ]);

    const movementByBatch = new Map<string, number>();
    const movementByFeedType = new Map<string, number>();

    for (const movement of movements) {
      const quantity = toNumber(movement.quantity_kg);
      movementByFeedType.set(
        movement.feed_type_id,
        (movementByFeedType.get(movement.feed_type_id) ?? 0) + quantity,
      );

      if (movement.feed_batch_id) {
        movementByBatch.set(
          movement.feed_batch_id,
          (movementByBatch.get(movement.feed_batch_id) ?? 0) + quantity,
        );
      }
    }

    const now = new Date();
    const fourteenDaysFromNow = new Date(now);
    fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

    return feedTypes.map((feedType) => {
      const feedTypeBatches = batches.filter((batch) => batch.feed_type_id === feedType.id);
      const batchStockValue = feedTypeBatches.reduce((sum, batch) => {
        const remainingQty = Math.max(
          getBatchRemainingQuantity({
            batchId: batch.id,
            movementByBatch,
          }),
          0,
        );
        return sum + remainingQty * toNumber(batch.unit_cost);
      }, 0);

      const stockOnHandKg = movementByFeedType.get(feedType.id) ?? 0;
      const averageCostPerKg = stockOnHandKg > 0 ? batchStockValue / stockOnHandKg : 0;

      const expiringSoonBatches = feedTypeBatches.filter((batch) => {
        if (!batch.expiry_date) return false;
        const expiry = new Date(batch.expiry_date);
        if (Number.isNaN(expiry.getTime())) return false;
        const remainingQty = movementByBatch.get(batch.id) ?? 0;
        return remainingQty > 0 && expiry <= fourteenDaysFromNow;
      }).length;

      return {
        feedType,
        stockOnHandKg,
        averageCostPerKg,
        stockValue: batchStockValue,
        lowStock: stockOnHandKg <= toNumber(feedType.low_stock_threshold_kg),
        expiringSoonBatches,
      };
    });
  },

  async getFarmInventorySummary(farmId: string): Promise<FeedInventorySummary> {
    const summaryRows = await this.getFeedTypeInventorySummary(farmId);

    return {
      totalFeedTypes: summaryRows.length,
      totalStockOnHandKg: summaryRows.reduce((sum, row) => sum + row.stockOnHandKg, 0),
      lowStockItems: summaryRows.filter((row) => row.lowStock).length,
      expiringSoonItems: summaryRows.filter((row) => row.expiringSoonBatches > 0).length,
      totalStockValue: summaryRows.reduce((sum, row) => sum + row.stockValue, 0),
    };
  },
};
