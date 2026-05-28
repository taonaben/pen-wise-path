import { createFileRoute } from "@tanstack/react-router";
import { AnimalPensPage } from "@/features/animals/pages/AnimalPensPage";

export const Route = createFileRoute("/_app/animals/pens")({
  component: AnimalPensPage,
});
