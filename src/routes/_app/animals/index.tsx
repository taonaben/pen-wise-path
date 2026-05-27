import { createFileRoute } from "@tanstack/react-router";
import { AnimalsPage } from "@/features/animals/pages/AnimalsPage";

export const Route = createFileRoute("/_app/animals/")({
  component: AnimalsPage,
});
