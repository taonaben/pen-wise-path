import { createFileRoute } from "@tanstack/react-router";
import { FeedTypeDetailPage } from "@/features/feed/pages/FeedTypeDetailPage";

export const Route = createFileRoute("/_app/feed/types/$id")({
  component: FeedTypeDetailRoute,
});

function FeedTypeDetailRoute() {
  const { id } = Route.useParams();
  return <FeedTypeDetailPage feedTypeId={id} />;
}
