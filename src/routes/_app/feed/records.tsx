import { createFileRoute } from "@tanstack/react-router";
import { FeedRecordsPage } from "@/features/feed/pages/FeedRecordsPage";

export const Route = createFileRoute("/_app/feed/records")({
  component: FeedRecordsPage,
});
