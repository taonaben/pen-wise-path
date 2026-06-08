import { supabase } from "@/shared/lib/supabase";
import { handleSupabaseError } from "@/shared/services/baseService";
import type { FarmMember, Profile } from "@/features/farm/types/farm.types";
import type { GlobalSearchArgs, SearchResult } from "../types/search.types";

// The project still uses placeholder generated DB types, so table queries need a local loose cast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

type AnimalSearchRow = {
  id: string;
  tag_number: string;
  breed: string | null;
  status: string;
  notes: string | null;
  purchase_weight_kg: number | string | null;
  species: { name: string; slug: string } | null;
  breed_record: { name: string; slug: string } | null;
};

type AlertSearchRow = {
  id: string;
  title: string;
  message: string;
  severity: string;
  alert_type: string;
};

type AuditSearchRow = {
  id: string;
  action: string;
  entity_type: string;
  description: string | null;
  created_at: string;
};

type FeedTypeSearchRow = {
  id: string;
  name: string;
  cost_per_kg: number | string | null;
  protein_percentage: number | string | null;
  notes: string | null;
};

type FeedingEventSearchRow = {
  id: string;
  feeding_date: string;
  feeding_method: "individual" | "pen_group";
  quantity_kg: number | string | null;
  notes: string | null;
  feed_type: { name: string } | null;
  pen: { name: string } | null;
  feeding_event_animals: Array<{
    animal: { tag_number: string | null } | null;
  }>;
};

type SaleRecordSearchRow = {
  id: string;
  sold_at: string;
  buyer_name: string | null;
  sale_status: string | null;
  payment_status: string | null;
  total_amount: number | string | null;
  net_profit: number | string | null;
  notes: string | null;
  animal: { tag_number: string | null } | null;
  species: { name: string } | null;
};

function contains(value: unknown, query: string) {
  return String(value ?? "")
    .toLowerCase()
    .includes(query.toLowerCase());
}

function cap(results: SearchResult[], limit: number) {
  return results.slice(0, limit);
}

async function searchAnimals(args: GlobalSearchArgs): Promise<SearchResult[]> {
  if (!args.permissions.viewAnimals) return [];

  const { data, error } = await db
    .from("animals")
    .select(
      `
        id,
        tag_number,
        breed,
        status,
        notes,
        purchase_weight_kg,
        species:animal_species!animals_species_id_fkey(name, slug),
        breed_record:animal_breeds!animals_breed_id_fkey(name, slug)
      `,
    )
    .eq("farm_id", args.farmId)
    .limit(100);

  if (error) handleSupabaseError(error);

  return cap(
    ((data ?? []) as AnimalSearchRow[])
      .filter((animal) =>
        [
          animal.tag_number,
          animal.breed,
          animal.breed_record?.name,
          animal.species?.name,
          animal.status,
          animal.notes,
        ].some((value) => contains(value, args.query)),
      )
      .map((animal) => ({
        id: animal.id,
        type: "animal",
        group: "Animals",
        title: animal.tag_number,
        subtitle: [
          animal.species?.name,
          animal.breed_record?.name ?? animal.breed,
          animal.status,
          animal.purchase_weight_kg ? `${animal.purchase_weight_kg}kg` : null,
        ]
          .filter(Boolean)
          .join(" - "),
        path: `/animals/${animal.id}`,
        metadata: animal,
      })),
    args.limit ?? 5,
  );
}

async function searchMembers(args: GlobalSearchArgs): Promise<SearchResult[]> {
  if (!args.permissions.globalSearchMembers) return [];

  const { data: membersData, error: memberError } = await db
    .from("farm_members")
    .select("*")
    .eq("farm_id", args.farmId)
    .limit(100);

  if (memberError) handleSupabaseError(memberError);

  const members = (membersData ?? []) as FarmMember[];
  if (members.length === 0) return [];

  const { data: profilesData, error: profileError } = await db
    .from("profiles")
    .select("*")
    .in(
      "id",
      members.map((member) => member.user_id),
    );

  if (profileError) handleSupabaseError(profileError);

  const profiles = new Map(
    ((profilesData ?? []) as Profile[]).map((profile) => [profile.id, profile]),
  );

  return cap(
    members
      .map((member) => ({ member, profile: profiles.get(member.user_id) }))
      .filter(({ member, profile }) =>
        [profile?.full_name, profile?.email, member.role, member.status].some((value) =>
          contains(value, args.query),
        ),
      )
      .map(({ member, profile }) => ({
        id: member.id,
        type: "member",
        group: "Members",
        title: profile?.full_name || profile?.email || `User ${member.user_id.slice(0, 8)}`,
        subtitle: `${member.role} - ${member.status}`,
        path: "/farm/members",
        metadata: { role: member.role, status: member.status },
      })),
    args.limit ?? 5,
  );
}

async function searchAlerts(args: GlobalSearchArgs): Promise<SearchResult[]> {
  const pattern = `%${args.query}%`;
  const { data, error } = await db
    .from("alerts")
    .select("id, title, message, severity, alert_type")
    .eq("farm_id", args.farmId)
    .or(
      `title.ilike.${pattern},message.ilike.${pattern},severity.ilike.${pattern},alert_type.ilike.${pattern}`,
    )
    .limit(args.limit ?? 5);

  if (error) handleSupabaseError(error);

  return ((data ?? []) as AlertSearchRow[]).map((alert) => ({
    id: alert.id,
    type: "alert",
    group: "Alerts",
    title: alert.title,
    subtitle: `${alert.severity} - ${alert.alert_type}`,
    path: "/animals/alerts",
    metadata: alert,
  }));
}

async function searchAuditLogs(args: GlobalSearchArgs): Promise<SearchResult[]> {
  if (!args.permissions.globalSearchAuditLogs) return [];

  const pattern = `%${args.query}%`;
  const { data, error } = await db
    .from("audit_logs")
    .select("id, action, entity_type, description, created_at")
    .eq("farm_id", args.farmId)
    .or(`action.ilike.${pattern},entity_type.ilike.${pattern},description.ilike.${pattern}`)
    .order("created_at", { ascending: false })
    .limit(args.limit ?? 5);

  if (error) handleSupabaseError(error);

  return ((data ?? []) as AuditSearchRow[]).map((log) => ({
    id: log.id,
    type: "audit_log",
    group: "Audit Logs",
    title: log.description || log.action,
    subtitle: `${log.action} - ${log.entity_type}`,
    path: "/farm/audit-logs",
    metadata: log,
  }));
}

async function searchFeedTypes(args: GlobalSearchArgs): Promise<SearchResult[]> {
  const pattern = `%${args.query}%`;
  const { data, error } = await db
    .from("feed_types")
    .select("id, name, cost_per_kg, protein_percentage, notes")
    .eq("farm_id", args.farmId)
    .or(`name.ilike.${pattern},notes.ilike.${pattern}`)
    .limit(args.limit ?? 5);

  if (error) handleSupabaseError(error);

  return ((data ?? []) as FeedTypeSearchRow[]).map((feed) => ({
    id: feed.id,
    type: "feed_type",
    group: "Feed",
    title: feed.name,
    subtitle: `$${Number(feed.cost_per_kg ?? 0).toFixed(2)}/kg${
      feed.protein_percentage ? ` - ${feed.protein_percentage}% protein` : ""
    }`,
    path: "/feed/types",
    metadata: feed,
  }));
}

async function searchFeedingEvents(args: GlobalSearchArgs): Promise<SearchResult[]> {
  const { data, error } = await db
    .from("feeding_events")
    .select(
      `
        id,
        feeding_date,
        feeding_method,
        quantity_kg,
        notes,
        feed_type:feed_types(name),
        pen:pens(name),
        feeding_event_animals(
          animal:animals(tag_number)
        )
      `,
    )
    .eq("farm_id", args.farmId)
    .order("feeding_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) handleSupabaseError(error);

  return cap(
    ((data ?? []) as FeedingEventSearchRow[])
      .filter((event) => {
        const animalTags = (event.feeding_event_animals ?? [])
          .map((allocation) => allocation.animal?.tag_number)
          .join(" ");

        return [
          event.feed_type?.name,
          event.pen?.name,
          event.feeding_method,
          event.notes,
          event.feeding_date,
          animalTags,
        ].some((value) => contains(value, args.query));
      })
      .map((event) => {
        const animalsFed = event.feeding_event_animals?.length ?? 0;
        return {
          id: event.id,
          type: "feeding_event" as const,
          group: "Feed",
          title: event.feed_type?.name ?? "Feeding Event",
          subtitle: [
            event.feeding_date,
            event.feeding_method === "pen_group" ? (event.pen?.name ?? "Pen") : "Individual",
            `${animalsFed} animal${animalsFed === 1 ? "" : "s"}`,
          ]
            .filter(Boolean)
            .join(" - "),
          path: "/feed/records",
          metadata: event,
        };
      }),
    args.limit ?? 5,
  );
}

async function searchSalesRecords(args: GlobalSearchArgs): Promise<SearchResult[]> {
  const { data, error } = await db
    .from("sales_records")
    .select(
      `
        id,
        sold_at,
        buyer_name,
        sale_status,
        payment_status,
        total_amount,
        net_profit,
        notes,
        animal:animals(tag_number),
        species:animal_species(name)
      `,
    )
    .eq("farm_id", args.farmId)
    .order("sold_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) handleSupabaseError(error);

  return cap(
    ((data ?? []) as SaleRecordSearchRow[])
      .filter((sale) =>
        [
          sale.animal?.tag_number,
          sale.species?.name,
          sale.buyer_name,
          sale.sale_status,
          sale.payment_status,
          sale.notes,
        ].some((value) => contains(value, args.query)),
      )
      .map((sale) => ({
        id: sale.id,
        type: "sale_record" as const,
        group: "Market Sales",
        title: sale.animal?.tag_number ?? "Sale Record",
        subtitle: [
          sale.buyer_name,
          sale.sale_status,
          sale.total_amount ? `$${Number(sale.total_amount).toFixed(2)}` : null,
        ]
          .filter(Boolean)
          .join(" - "),
        path: "/market/sales",
        metadata: sale,
      })),
    args.limit ?? 5,
  );
}

function searchReportPages(args: GlobalSearchArgs): SearchResult[] {
  const reportPages: SearchResult[] = [
    {
      id: "feed-cost",
      type: "report",
      group: "Reports",
      title: "Feed Cost Report",
      subtitle: "Feed spend, efficiency, and cost trends",
      path: "/reports/feed-cost",
      metadata: { keywords: ["feed", "cost", "efficiency", "fcr"] },
    },
    {
      id: "performance",
      type: "report",
      group: "Reports",
      title: "Performance Report",
      subtitle: "Growth, weight gain, and conversion performance",
      path: "/reports/performance",
      metadata: { keywords: ["performance", "growth", "weight", "conversion"] },
    },
    {
      id: "profitability",
      type: "report",
      group: "Reports",
      title: "Profitability Report",
      subtitle: "Profit margins and sale outcomes",
      path: "/reports/profitability",
      metadata: { keywords: ["profit", "margin", "sales", "revenue"] },
    },
  ];

  return reportPages.filter((report) => {
    const keywords = (report.metadata?.keywords as string[] | undefined)?.join(" ") ?? "";
    return [report.title, report.subtitle, keywords].some((value) => contains(value, args.query));
  });
}

export const searchService = {
  async globalSearch(args: GlobalSearchArgs): Promise<SearchResult[]> {
    const normalizedQuery = args.query.trim();
    if (normalizedQuery.length < 2) return [];

    const normalizedArgs = { ...args, query: normalizedQuery, limit: args.limit ?? 5 };
    const groups = await Promise.all([
      searchAnimals(normalizedArgs),
      searchMembers(normalizedArgs),
      searchAlerts(normalizedArgs),
      searchAuditLogs(normalizedArgs),
      searchFeedTypes(normalizedArgs),
      searchFeedingEvents(normalizedArgs),
      searchSalesRecords(normalizedArgs),
      Promise.resolve(searchReportPages(normalizedArgs)),
    ]);

    return groups.flat();
  },
};
