import { createFileRoute } from "@tanstack/react-router";
import { FeedTypesPage } from "@/features/feed/pages/FeedTypesPage";

export const Route = createFileRoute("/_app/feed/types")({
  component: FeedTypesPage,
});
