import {
  LayoutDashboard,
  Building2,
  Beef,
  Wheat,
  TrendingUp,
  FileBarChart2,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type SidebarChild = { title: string; path: string };
export type SidebarItem = {
  title: string;
  path?: string;
  icon: LucideIcon;
  children?: SidebarChild[];
};

export const sidebarConfig: SidebarItem[] = [
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  {
    title: "Farm Management",
    icon: Building2,
    children: [
      { title: "Farm Profile", path: "/farm/profile" },
      { title: "Members", path: "/farm/members" },
      { title: "Audit Logs", path: "/farm/audit-logs" },
    ],
  },
  {
    title: "Animals",
    icon: Beef,
    children: [
      { title: "All Animals", path: "/animals" },
      { title: "Weight Records", path: "/animals/weights" },
      { title: "Growth Alerts", path: "/animals/alerts" },
    ],
  },
  {
    title: "Feed Management",
    icon: Wheat,
    children: [
      { title: "Feed Types", path: "/feed/types" },
      { title: "Feed Records", path: "/feed/records" },
      { title: "Cost Analysis", path: "/feed/analysis" },
    ],
  },
  {
    title: "Market & Sales",
    icon: TrendingUp,
    children: [
      { title: "Market Prices", path: "/market/prices" },
      { title: "Selling Predictions", path: "/market/predictions" },
      { title: "Sales Records", path: "/market/sales" },
    ],
  },
  {
    title: "Reports",
    icon: FileBarChart2,
    children: [
      { title: "Performance", path: "/reports/performance" },
      { title: "Feed Cost", path: "/reports/feed-cost" },
      { title: "Profitability", path: "/reports/profitability" },
    ],
  },
  { title: "Settings", path: "/settings", icon: Settings },
];
