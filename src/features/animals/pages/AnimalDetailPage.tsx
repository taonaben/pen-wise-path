import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentFarm } from "@/features/farm/hooks/useCurrentFarm";
import { AnimalActivityTab } from "../components/detail/AnimalActivityTab";
import { AnimalDetailHeader } from "../components/detail/AnimalDetailHeader";
import { AnimalFeedingTab } from "../components/detail/AnimalFeedingTab";
import { AnimalHealthTab } from "../components/detail/AnimalHealthTab";
import { AnimalOverviewTab } from "../components/detail/AnimalOverviewTab";
import { AnimalPredictionsTab } from "../components/detail/AnimalPredictionsTab";
import { AnimalWeightTab } from "../components/detail/AnimalWeightTab";
import { useAnimal } from "../hooks/useAnimal";
import { useAnimalAlerts } from "../hooks/useAnimalAlerts";
import { useAnimalAuditLogs } from "../hooks/useAnimalAuditLogs";
import { useAnimalFeedAllocations } from "../hooks/useAnimalFeedAllocations";
import { useAnimalHealthAssessment } from "../hooks/useAnimalHealthAssessment";
import { useAnimalHealthEvents } from "../hooks/useAnimalHealthEvents";
import { useAnimalPen } from "../hooks/useAnimalPen";
import { useAnimalWeights } from "../hooks/useAnimalWeights";
import { useCreateHealthEvent } from "../hooks/useCreateHealthEvent";
import { useGenerateHealthAssessments } from "../hooks/useGenerateHealthAssessments";
import { useGenerateGrowthAlerts } from "../hooks/useGenerateGrowthAlerts";
import { calculateAnimalDetailMetrics } from "../services/animalAnalyticsService";
import type { CreateHealthEventPayload } from "../types/animal.types";

export function AnimalDetailPage({ animalId }: { animalId: string }) {
  const { currentFarm } = useCurrentFarm();
  const generateGrowthAlerts = useGenerateGrowthAlerts(currentFarm.id);
  const generateHealthAssessments = useGenerateHealthAssessments(currentFarm.id);
  const createHealthEvent = useCreateHealthEvent(currentFarm.id, animalId);
  const animalQuery = useAnimal(currentFarm.id, animalId);
  const weightQuery = useAnimalWeights(currentFarm.id, animalId);
  const feedQuery = useAnimalFeedAllocations(currentFarm.id, animalId);
  const healthAssessmentQuery = useAnimalHealthAssessment(currentFarm.id, animalId);
  const healthQuery = useAnimalHealthEvents(currentFarm.id, animalId);
  const alertQuery = useAnimalAlerts(currentFarm.id, animalId);
  const auditQuery = useAnimalAuditLogs(currentFarm.id, animalId);
  const penQuery = useAnimalPen(currentFarm.id, animalId);
  const animal = animalQuery.data;

  const weightRecords = useMemo(() => weightQuery.data ?? [], [weightQuery.data]);
  const feedAllocations = useMemo(() => feedQuery.data ?? [], [feedQuery.data]);
  const healthEvents = healthQuery.data ?? [];
  const alerts = alertQuery.data ?? [];
  const auditLogs = auditQuery.data ?? [];

  const metrics = useMemo(() => {
    if (!animal) return null;
    return calculateAnimalDetailMetrics(animal, weightRecords, feedAllocations);
  }, [animal, feedAllocations, weightRecords]);

  const onAnalyzeAnimal = async () => {
    try {
      const result = await generateGrowthAlerts.mutateAsync({
        mode: "single_animal",
        animalId,
      });
      toast.success(
        `Analysis complete: ${result.generated_alerts} generated, ${result.updated_alerts} updated.`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Animal analysis failed";
      toast.error(message);
    }
  };

  const onRunHealthAssessment = async () => {
    try {
      const result = await generateHealthAssessments.mutateAsync({
        mode: "single_animal",
        animalId,
      });
      const assessment = result.assessments.find((item) => item.animal_id === animalId);
      if (assessment) {
        toast.success(
          `Health status updated: ${assessment.health_status} (${assessment.health_score}%).`,
        );
        return;
      }
      toast.success("Health assessment completed.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Health assessment failed";
      toast.error(message);
    }
  };

  const onAddHealthEvent = async (
    payload: Omit<CreateHealthEventPayload, "farmId" | "animalId">,
    runAssessmentAfterSave: boolean,
  ) => {
    try {
      await createHealthEvent.mutateAsync(payload);
      toast.success("Health event recorded.");

      if (runAssessmentAfterSave) {
        await onRunHealthAssessment();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save health event";
      toast.error(message);
      throw error;
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/animals"
          className="inline-flex items-center gap-1.5 text-sm text-farm-muted hover:text-farm-lime"
        >
          <ArrowLeft className="h-4 w-4" /> Back to animals
        </Link>

        <button
          type="button"
          onClick={onAnalyzeAnimal}
          disabled={generateGrowthAlerts.isPending}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-farm-lime px-4 text-sm font-medium text-farm-950 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {generateGrowthAlerts.isPending ? "Analyzing..." : "Analyze Animal"}
        </button>
      </div>

      {animalQuery.isLoading && (
        <div className="rounded-xl border bg-farm-800/80 p-6 text-sm text-farm-muted">
          Loading animal...
        </div>
      )}

      {animalQuery.isError && (
        <div className="rounded-xl border border-farm-danger/30 bg-farm-danger/10 p-6 text-sm text-farm-danger">
          Animal could not be loaded.
        </div>
      )}

      {animal && metrics && (
        <>
          <AnimalDetailHeader
            animal={animal}
            farmName={currentFarm.name}
            currentPen={penQuery.data}
          />

          <Tabs defaultValue="overview" className="space-y-5">
            <div className="overflow-x-auto">
              <TabsList className="h-auto min-w-max justify-start bg-farm-900/70 p-1">
                {["Overview", "Weight", "Feeding", "Health", "Predictions", "Activity"].map(
                  (tab) => (
                    <TabsTrigger
                      key={tab}
                      value={tab.toLowerCase()}
                      className="data-[state=active]:bg-farm-700 data-[state=active]:text-foreground"
                    >
                      {tab}
                    </TabsTrigger>
                  ),
                )}
              </TabsList>
            </div>

            <TabsContent value="overview">
              <AnimalOverviewTab
                animal={animal}
                metrics={metrics}
                weightRecords={weightRecords}
                alerts={alerts}
              />
            </TabsContent>

            <TabsContent value="weight">
              <AnimalWeightTab
                records={weightRecords}
                metrics={metrics}
                isLoading={weightQuery.isLoading}
              />
            </TabsContent>

            <TabsContent value="feeding">
              <AnimalFeedingTab
                allocations={feedAllocations}
                metrics={metrics}
                isLoading={feedQuery.isLoading}
              />
            </TabsContent>

            <TabsContent value="health">
              <AnimalHealthTab
                assessment={healthAssessmentQuery.data ?? null}
                isAssessmentLoading={healthAssessmentQuery.isLoading}
                isRunningAssessment={generateHealthAssessments.isPending}
                isCreatingEvent={createHealthEvent.isPending}
                onRunAssessment={onRunHealthAssessment}
                onAddHealthEvent={onAddHealthEvent}
                events={healthEvents}
                isLoading={healthQuery.isLoading}
              />
            </TabsContent>

            <TabsContent value="predictions">
              <AnimalPredictionsTab animal={animal} />
            </TabsContent>

            <TabsContent value="activity">
              <AnimalActivityTab logs={auditLogs} isLoading={auditQuery.isLoading} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
