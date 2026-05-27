import { createFileRoute } from "@tanstack/react-router";
import { AnimalDetailPage } from "@/features/animals/pages/AnimalDetailPage";

export const Route = createFileRoute("/_app/animals/$id")({
  component: AnimalDetailRoute,
});

function AnimalDetailRoute() {
  const { id } = Route.useParams();
  return <AnimalDetailPage animalId={id} />;
}
