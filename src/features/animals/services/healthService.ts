import { supabase } from "@/shared/lib/supabase";
import { handleSupabaseError } from "@/shared/services/baseService";
import type {
  CreateHealthEventPayload,
  HealthAssessment,
  HealthEvent,
} from "../types/animal.types";

// The project still uses placeholder generated DB types, so table queries need a local loose cast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const healthService = {
  async getAnimalHealthEvents(farmId: string, animalId: string): Promise<HealthEvent[]> {
    const { data, error } = await db
      .from("health_events")
      .select("*")
      .eq("farm_id", farmId)
      .eq("animal_id", animalId)
      .order("observed_at", { ascending: false, nullsFirst: false })
      .order("event_date", { ascending: false });

    if (error) handleSupabaseError(error);
    return (data ?? []) as HealthEvent[];
  },

  async getLatestAnimalHealthAssessment(
    farmId: string,
    animalId: string,
  ): Promise<HealthAssessment | null> {
    const { data, error } = await db
      .from("health_assessments")
      .select("*")
      .eq("farm_id", farmId)
      .eq("animal_id", animalId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) handleSupabaseError(error);
    return (data ?? null) as HealthAssessment | null;
  },

  async createHealthEvent(payload: CreateHealthEventPayload): Promise<HealthEvent> {
    const safeSymptoms = payload.symptoms.trim();
    const safeDiagnosis = payload.diagnosisNote?.trim() ?? "";
    const safeTreatment = payload.treatmentGiven?.trim() ?? "";

    const title =
      payload.title?.trim() ||
      (safeSymptoms.length > 0
        ? safeSymptoms.slice(0, 80)
        : safeDiagnosis.length > 0
          ? safeDiagnosis.slice(0, 80)
          : `${payload.eventType} noted`);

    const resolvedAt = payload.status === "resolved" ? new Date().toISOString() : null;

    const { data, error } = await db
      .from("health_events")
      .insert({
        farm_id: payload.farmId,
        animal_id: payload.animalId,
        event_date: payload.observedAt,
        observed_at: payload.observedAt,
        event_type: payload.eventType,
        severity: payload.severity,
        title,
        notes: safeDiagnosis || safeSymptoms || null,
        symptoms: safeSymptoms || null,
        diagnosis_note: safeDiagnosis || null,
        treatment: safeTreatment || null,
        treatment_given: safeTreatment || null,
        treated_by: payload.treatedBy?.trim() || null,
        recovery_notes: payload.recoveryNotes?.trim() || null,
        status: payload.status,
        resolved_at: resolvedAt,
      })
      .select("*")
      .single();

    if (error) handleSupabaseError(error);
    return data as HealthEvent;
  },
};
