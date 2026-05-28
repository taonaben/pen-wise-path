import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { MarketSource, MarketSourcePayload } from "../types/market.types";
import { MarketSourceForm } from "./MarketSourceForm";

type Props = {
  farmId: string;
  sources: MarketSource[];
  onCreate: (payload: MarketSourcePayload) => Promise<void>;
  onUpdate: (sourceId: string, payload: MarketSourcePayload) => Promise<void>;
  onDeactivate: (sourceId: string) => Promise<void>;
};

export function MarketSourceManager({
  farmId,
  sources,
  onCreate,
  onUpdate,
  onDeactivate,
}: Props) {
  const [editingSource, setEditingSource] = useState<MarketSource | null>(null);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      {showForm && (
        <MarketSourceForm
          farmId={farmId}
          initialSource={editingSource}
          onCancel={() => {
            setShowForm(false);
            setEditingSource(null);
          }}
          onSubmit={async (payload) => {
            if (editingSource) {
              await onUpdate(editingSource.id, payload);
            } else {
              await onCreate(payload);
            }
            setShowForm(false);
            setEditingSource(null);
          }}
        />
      )}

      {!showForm && (
        <Button type="button" onClick={() => setShowForm(true)}>
          Add Source
        </Button>
      )}

      <div className="max-h-96 overflow-y-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-farm-900/60 text-xs uppercase text-farm-muted">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => (
              <tr key={source.id} className="border-t border-farm-600/30">
                <td className="px-4 py-3 font-medium">{source.name}</td>
                <td className="px-4 py-3 capitalize">{source.source_type.replaceAll("_", " ")}</td>
                <td className="px-4 py-3">{source.is_active ? "Active" : "Inactive"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingSource(source);
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </Button>
                    {source.is_active && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => onDeactivate(source.id)}
                      >
                        Deactivate
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sources.length === 0 && <div className="p-4 text-sm text-farm-muted">No market sources yet.</div>}
      </div>
    </div>
  );
}
