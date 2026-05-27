import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
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
import { useAnimalHealthEvents } from "../hooks/useAnimalHealthEvents";
import { useAnimalPen } from "../hooks/useAnimalPen";
import { useAnimalWeights } from "../hooks/useAnimalWeights";
import { calculateAnimalDetailMetrics } from "../services/animalAnalyticsService";

export function AnimalDetailPage({ animalId }: { animalId: string }) {
  const { currentFarm } = useCurrentFarm();
  const animalQuery = useAnimal(currentFarm.id, animalId);
  const weightQuery = useAnimalWeights(currentFarm.id, animalId);
  const feedQuery = useAnimalFeedAllocations(currentFarm.id, animalId);
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

  return (
    <div className="space-y-5">
      <Link
        to="/animals"
        className="inline-flex items-center gap-1.5 text-sm text-farm-muted hover:text-farm-lime"
      >
        <ArrowLeft className="h-4 w-4" /> Back to animals
      </Link>

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
              <AnimalOverviewTab animal={animal} metrics={metrics} alerts={alerts} />
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
              <AnimalHealthTab events={healthEvents} isLoading={healthQuery.isLoading} />
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
