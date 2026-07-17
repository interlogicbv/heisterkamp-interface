interface RawTruck {
  truck_number?: unknown;
  license_plate?: unknown;
  driver_first_name?: unknown;
  activity_id?: unknown;
  activity_time?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  position_time?: unknown;
  location?: unknown;
  country?: unknown;
  activity?: { act_desc_nl?: unknown; act_desc?: unknown } | null;
}

export interface TruckActivity {
  /** Id uit de externe database, indien gematcht */
  id?: unknown;
  truck_number: unknown;
  license_plate: unknown;
  driver: unknown;
  activity_code: number;
  activity: unknown;
  activity_time: unknown;
  latitude: unknown;
  longitude: unknown;
  position_time: unknown;
  location: unknown;
  country: unknown;
}

/**
 * Filtert de trucks op huidige activiteit (bijv. 30 = Laden, 40 = Lossen)
 * en houdt per truck alleen de relevante velden over.
 * Met activityCodes "all" worden alle trucks opgenomen (alleen compacte velden).
 */
export function transformTrucks(
  data: unknown,
  activityCodes: number[] | "all",
  idMatch?: { map: Map<string, unknown>; truckField: string },
): TruckActivity[] {
  if (!Array.isArray(data)) {
    throw new Error("Verwachtte een array van trucks in de API-response");
  }

  return (data as RawTruck[])
    .filter((truck) => activityCodes === "all" || activityCodes.includes(Number(truck.activity_id)))
    .map((truck) => ({
      id: idMatch?.map.get(String((truck as Record<string, unknown>)[idMatch.truckField]).trim()),
      truck_number: truck.truck_number,
      license_plate: truck.license_plate,
      driver: truck.driver_first_name,
      activity_code: Number(truck.activity_id),
      activity: truck.activity?.act_desc_nl ?? truck.activity?.act_desc,
      activity_time: truck.activity_time,
      latitude: truck.latitude,
      longitude: truck.longitude,
      position_time: truck.position_time,
      location: truck.location,
      country: truck.country,
    }));
}
