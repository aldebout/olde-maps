export const getGMapsDistanceAndTime = async (
  origin: string,
  destination: string
) => {
  const response = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      body: JSON.stringify({
        origin: { address: origin },
        destination: { address: destination },
        travelMode: "DRIVE",
        computeAlternativeRoutes: false,
        routeModifiers: {
          avoidTolls: false,
        },
        languageCode: "en-US",
        units: "METRIC",
      }),
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY!,
        "X-Goog-FieldMask": "routes.staticDuration,routes.distanceMeters",
      },
    }
  );

  const data = await response.json();

  return {
    distance: data.routes[0].distanceMeters / 1000,
    time: Number(data.routes[0].staticDuration.replace("s", "")) / 60,
  };
};
