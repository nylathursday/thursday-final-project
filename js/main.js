//JavaScript adapted from ArcGIS API for JavaScript sample code: Swipe widget with scroll
//JavaScript adapted by Nyla Thursday, 2022
//Data Source: Couty Health Rankings, Wisconsin 2022


require([
    "esri/WebMap",
    "esri/views/MapView",
    "esri/widgets/Swipe",
    "esri/widgets/Legend",
    "esri/widgets/Print"
  ], (WebMap, MapView, Swipe, Legend, Print) => {
    let view, swipes;

    const scroller = document.querySelector(".scroller");
    const content = scroller.querySelector(".content");

    // initialize the map
    const map = new WebMap({
      portalItem: {
        id: "097cd935f66b4178928d7800008edfaa"
      }
    });

    map
      .load()
      .then(() => {
        // create the view
        view = new MapView({
          container: "viewDiv", //adjust viewDiv in style.css
          map: map,
          zoom: 7,
          center: [-90, 44.7]
        });

        // get the layers from the webmap
        const layers = map.layers;

        // create a swipe widget for each layer
        swipes = layers.map((layer) => {
          return new Swipe({
            view: view,
            disabled: true,
            position: 100,
            direction: "horizontal",
            trailingLayers: [layer],
            visibleElements: {
              handle: true,
              divider: true
            }
          });
        });


        // //create print option
        let print = new Print({
            view: view,
            printServiceUrl:
                    "https://utility.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task", //
            allowedFormats: ["jpg"], //only allow jpg
            allowedLayouts: ["a3-portrait"] //only allow portrait
            });

        view.ui.add(print, {
            position: "top-left"
        });

        // create a legend for each layer and add it to the map
        layers.forEach((layer) => {
          const slide = document.createElement("div");
          slide.className = "slide";
          const legendDiv = document.createElement("div");
          legendDiv.className = "legend";
          const legend = new Legend({
            container: legendDiv,
            view: view,
            style: "card",
            layerInfos: [
              {
                layer: layer
              }
            ]
          });
          slide.appendChild(legendDiv);
          content.appendChild(slide);
        });

        return view.when();
      })
      .then(() => {
        let height = 0;

        function updateSize() {
          height = view.height * swipes.length;
          setScroll(scroller.scrollTop);
          content.style.height = height + "px";
        }

        function clamp(value, min, max) {
          return Math.min(max, Math.max(min, value));
        }

        let scroll = 0;
        let ticking = false;
        function setScroll(value) {
          scroll = value;

          if (!ticking) {
            requestAnimationFrame(() => {
              ticking = false;

              let pageRatio = scroll / view.height;

              swipes.forEach((swipe, index, swipes) => {
                // add each swipe to the view UI
                view.ui.add(swipe);

                let position = (index - pageRatio) * 100;

                //swap layers for infinite scroll feel
                if (position < 0 && swipe.trailingLayers.length) {
                  swipe.leadingLayers.addMany(swipe.trailingLayers); //leading layer starts
                  swipe.trailingLayers.removeAll(); //remove trailing
                } else if (position >= 0 && swipe.leadingLayers.length) {
                  swipe.trailingLayers.addMany(swipe.leadingLayers);
                  swipe.leadingLayers.removeAll();
                }

                if (position < 0) {
                  position += 100;
                }

                swipe.position = clamp(position, 0, 100);
              });
            });

            ticking = true;
          }
        }

        view.watch("height", updateSize);
        updateSize();

        // show layer legends after map has loaded
        const legendDivs = document.getElementsByClassName("legend");
        for (let i = 0; i < legendDivs.length; i++) {
          legendDivs[i].style.visibility = "visible";
        }

        // stop default scroll
        scroller.addEventListener("wheel", (event) => {
          event.stopImmediatePropagation();
        });

        scroller.addEventListener("scroll", (event) => {
          setScroll(scroller.scrollTop);
        });
      })
      .catch((error) => {
        console.error(error);
      });
  });