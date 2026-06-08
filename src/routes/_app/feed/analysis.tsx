import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { useCurrentFarm } from "@/features/farm/hooks/useCurrentFarm";
import { useAnimalSpecies } from "@/features/animals/hooks/useAnimalSpecies";
import { usePens } from "@/features/animals/hooks/usePens";
import { useIsMobile } from "@/hooks/use-mobile";
import { feedTypeService } from "@/features/feed/services/feedTypeService";
import {
  getDefaultFeedCostAnalysisFilters,
  useFeedCostAnalysis,
} from "@/features/feed/hooks/useFeedCostAnalysis";
import {
  FeedCostFilters,
  type DatePreset,
} from "@/features/feed/components/cost-analysis/FeedCostFilters";
import { FeedCostSummaryCards } from "@/features/feed/components/cost-analysis/FeedCostSummaryCards";
import { FeedCostTrendChart } from "@/features/feed/components/cost-analysis/FeedCostTrendChart";
import {
  FeedCostByFeedTypeChart,
  FeedCostByPenChart,
  FeedCostBySpeciesChart,
} from "@/features/feed/components/cost-analysis/FeedCostBreakdownCharts";
import { FeedEfficiencyTable } from "@/features/feed/components/cost-analysis/FeedEfficiencyTable";
import { AnimalFeedCostTable } from "@/features/feed/components/cost-analysis/AnimalFeedCostTable";
import { PenFeedCostTable } from "@/features/feed/components/cost-analysis/PenFeedCostTable";
import { FeedCostInsights } from "@/features/feed/components/cost-analysis/FeedCostInsights";
import type { FeedCostAnalysisFilters } from "@/features/feed/types/feedCostAnalysis.types";

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function rangeForPreset(
  preset: DatePreset,
): Pick<FeedCostAnalysisFilters, "startDate" | "endDate"> {
  const end = new Date();
  const start = new Date();

  if (preset === "7") start.setDate(end.getDate() - 6);
  if (preset === "30") start.setDate(end.getDate() - 29);
  if (preset === "90") start.setDate(end.getDate() - 89);
  if (preset === "month") start.setDate(1);

  return {
    startDate: isoDate(start),
    endDate: isoDate(end),
  };
}

function FeedCostAnalysisPage() {
  const { currentFarm } = useCurrentFarm();
  const isMobile = useIsMobile();
  const [datePreset, setDatePreset] = useState<DatePreset>("30");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState<FeedCostAnalysisFilters>(
    getDefaultFeedCostAnalysisFilters,
  );

  const feedTypesQuery = useQuery({
    queryKey: ["feed-types-for-cost-analysis", currentFarm.id],
    queryFn: () => feedTypeService.listByFarm(currentFarm.id),
  });
  const speciesQuery = useAnimalSpecies();
  const pensQuery = usePens(currentFarm.id);
  const analysisQuery = useFeedCostAnalysis(currentFarm.id, filters);

  const onPresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset === "custom") return;
    setFilters((current) => ({ ...current, ...rangeForPreset(preset) }));
  };

  const analysis = analysisQuery.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Feed Cost Analysis"
        description="Where feed money is going, and whether it is turning into profitable gain."
      />

      {isMobile && (
        <Button
          type="button"
          variant="outline"
          className="w-full justify-center gap-2 border-farm-600/50 bg-farm-800/70 text-foreground hover:bg-farm-700/60"
          onClick={() => setShowMobileFilters((current) => !current)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {showMobileFilters ? "Hide Filters" : "Show Filters"}
        </Button>
      )}

      {(!isMobile || showMobileFilters) && (
        <FeedCostFilters
          filters={filters}
          datePreset={datePreset}
          feedTypes={feedTypesQuery.data ?? []}
          species={speciesQuery.data ?? []}
          pens={pensQuery.data ?? []}
          onPresetChange={onPresetChange}
          onFiltersChange={setFilters}
        />
      )}

      {analysisQuery.isLoading && (
        <div className="rounded-xl border bg-farm-800/80 p-5 text-sm text-farm-muted">
          Loading feed cost analysis...
        </div>
      )}

      {analysisQuery.isError && (
        <div className="rounded-xl border border-farm-danger/40 bg-farm-danger/10 p-5 text-sm text-farm-danger">
          Could not load feed cost analysis.
        </div>
      )}

      {analysis && (
        <>
          <FeedCostSummaryCards summary={analysis.summary} />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <FeedCostTrendChart data={analysis.trend} />
            <FeedCostByFeedTypeChart data={analysis.costByFeedType} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <FeedCostBySpeciesChart data={analysis.costBySpecies} />
            <FeedCostByPenChart data={analysis.costByPen} />
          </div>

          {isMobile ? (
            <Accordion
              type="multiple"
              defaultValue={["feed-efficiency"]}
              className="rounded-xl border border-farm-600/35 bg-farm-800/55 px-3"
            >
              <AccordionItem value="feed-efficiency" className="border-farm-600/30">
                <AccordionTrigger className="py-3 text-sm font-semibold hover:no-underline data-[state=open]:text-farm-lime [&[data-state=open]>svg]:text-farm-lime">
                  Feed Efficiency
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <FeedEfficiencyTable rows={analysis.feedEfficiencyRows} />
                </AccordionContent> 
              </AccordionItem>

              <AccordionItem value="animal-feed-cost" className="border-farm-600/30">
                <AccordionTrigger className="py-3 text-sm font-semibold hover:no-underline data-[state=open]:text-farm-lime [&[data-state=open]>svg]:text-farm-lime">
                  Animal Feed Cost
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <AnimalFeedCostTable rows={analysis.animalRows} />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="pen-feed-cost" className="border-farm-600/30">
                <AccordionTrigger className="py-3 text-sm font-semibold hover:no-underline data-[state=open]:text-farm-lime [&[data-state=open]>svg]:text-farm-lime">
                  Pen Feed Cost
                </AccordionTrigger>
                <AccordionContent className="pb-1">
                  <PenFeedCostTable rows={analysis.penRows} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : (
            <>
              <FeedEfficiencyTable rows={analysis.feedEfficiencyRows} />
              <AnimalFeedCostTable rows={analysis.animalRows} />
              <PenFeedCostTable rows={analysis.penRows} />
            </>
          )}

          <FeedCostInsights insights={analysis.insights} />
        </>
      )}
    </div>
  );
}

export const Route = createFileRoute("/_app/feed/analysis")({
  component: FeedCostAnalysisPage,
});
