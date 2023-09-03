export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoibWFuN29iZXIiLCJhIjoiY2xrMjVuZGZrMGYzdjNycGpuZ2ptdGNwZiJ9.QJMtoK57oD0XuKo7EFA-mg';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/man7ober/clk2dljrs001c01nw4p38ak2h',
    scrollZoom: false,
    // center: [-118.113491, 34.111745],
    // zoom: 4,
    // interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day} : ${loc.description}</p`)
      .addTo(map);

    // Extends map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
