(function (deckyFrontendLib, React) {
  'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var React__default = /*#__PURE__*/_interopDefaultLegacy(React);

  var DefaultContext = {
    color: undefined,
    size: undefined,
    className: undefined,
    style: undefined,
    attr: undefined
  };
  var IconContext = React__default["default"].createContext && React__default["default"].createContext(DefaultContext);

  var __assign = window && window.__assign || function () {
    __assign = Object.assign || function (t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
      }
      return t;
    };
    return __assign.apply(this, arguments);
  };
  var __rest = window && window.__rest || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
      if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
    }
    return t;
  };
  function Tree2Element(tree) {
    return tree && tree.map(function (node, i) {
      return React__default["default"].createElement(node.tag, __assign({
        key: i
      }, node.attr), Tree2Element(node.child));
    });
  }
  function GenIcon(data) {
    // eslint-disable-next-line react/display-name
    return function (props) {
      return React__default["default"].createElement(IconBase, __assign({
        attr: __assign({}, data.attr)
      }, props), Tree2Element(data.child));
    };
  }
  function IconBase(props) {
    var elem = function (conf) {
      var attr = props.attr,
        size = props.size,
        title = props.title,
        svgProps = __rest(props, ["attr", "size", "title"]);
      var computedSize = size || conf.size || "1em";
      var className;
      if (conf.className) className = conf.className;
      if (props.className) className = (className ? className + " " : "") + props.className;
      return React__default["default"].createElement("svg", __assign({
        stroke: "currentColor",
        fill: "currentColor",
        strokeWidth: "0"
      }, conf.attr, attr, svgProps, {
        className: className,
        style: __assign(__assign({
          color: props.color || conf.color
        }, conf.style), props.style),
        height: computedSize,
        width: computedSize,
        xmlns: "http://www.w3.org/2000/svg"
      }), title && React__default["default"].createElement("title", null, title), props.children);
    };
    return IconContext !== undefined ? React__default["default"].createElement(IconContext.Consumer, null, function (conf) {
      return elem(conf);
    }) : elem(DefaultContext);
  }

  // THIS FILE IS AUTO GENERATED
  function FaBible (props) {
    return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M448 358.4V25.6c0-16-9.6-25.6-25.6-25.6H96C41.6 0 0 41.6 0 96v320c0 54.4 41.6 96 96 96h326.4c12.8 0 25.6-9.6 25.6-25.6v-16c0-6.4-3.2-12.8-9.6-19.2-3.2-16-3.2-60.8 0-73.6 6.4-3.2 9.6-9.6 9.6-19.2zM144 144c0-8.84 7.16-16 16-16h48V80c0-8.84 7.16-16 16-16h32c8.84 0 16 7.16 16 16v48h48c8.84 0 16 7.16 16 16v32c0 8.84-7.16 16-16 16h-48v112c0 8.84-7.16 16-16 16h-32c-8.84 0-16-7.16-16-16V192h-48c-8.84 0-16-7.16-16-16v-32zm236.8 304H96c-19.2 0-32-12.8-32-32s16-32 32-32h284.8v64z"}}]})(props);
  }

  // Define the Content component
  const Content = ({ serverAPI }) => {
      const [verseOfTheDay, setVerseOfTheDay] = React.useState(null);
      const [error, setError] = React.useState(null); // To capture and display errors
      const [loading, setLoading] = React.useState(true); // To show a loading state
      // Function to log Verse of the Day to console and handle errors
      const logVerseOfTheDay = async () => {
          if (!serverAPI) {
              const errMsg = "serverAPI is not defined";
              console.error(errMsg); // Log the error
              setError(errMsg); // Show the error to the user
              setLoading(false);
              return;
          }
          try {
              setLoading(true); // Start loading
              // Fetch the Verse of the Day from the backend (main.py server)
              const response = await fetch("http://localhost:8777/api/verse-of-the-day");
              if (!response.ok) {
                  const fetchError = `Error: ${response.statusText}`;
                  console.error(fetchError); // Log the fetch error
                  setError(fetchError); // Show the error to the user
                  setLoading(false);
                  return;
              }
              const data = await response.json();
              // Log the full response to understand its structure
              console.log("Full Verse of the Day Response:", JSON.stringify(data, null, 2));
              // Check if we received the expected response
              if (!data) {
                  const noDataMsg = "No data received from the API.";
                  console.error(noDataMsg); // Log the error
                  setError(noDataMsg); // Show the error to the user
                  setLoading(false);
                  return;
              }
              // Destructure the response to get citation, passage, images, and version
              const { citation, passage, images, version } = data;
              // Log the checks
              console.log("Checking structure of the response...");
              console.log("Citation: ", citation);
              console.log("Passage: ", passage);
              console.log("Version: ", version);
              console.log("Images: ", images);
              if (citation && passage) {
                  console.log("Verse of the Day: Valid structure");
                  setVerseOfTheDay({
                      citation: citation.toString(),
                      passage: passage.toString(),
                      images: images ?? [],
                      version: version ?? "Unknown", // Default version if not found
                  });
              }
              else {
                  const invalidStructureMsg = `Invalid structure: Missing fields. Citation: ${citation}, Passage: ${passage}`;
                  console.error(invalidStructureMsg); // Log the error
                  setError(invalidStructureMsg); // Show the error to the user
              }
          }
          catch (error) {
              console.error("Failed to fetch the verse of the day:", error); // Log the error
              setError(`Failed to fetch the verse of the day: ${error instanceof Error ? error.message : error}`); // Show the error to the user
          }
          finally {
              setLoading(false); // Stop loading after the request completes
          }
      };
      // Call logVerseOfTheDay when the component is mounted
      React.useEffect(() => {
          logVerseOfTheDay();
      }, [serverAPI]);
      return (window.SP_REACT.createElement("div", null,
          window.SP_REACT.createElement("h1", null, "Verse of the Day"),
          loading && window.SP_REACT.createElement("p", null, "Loading verse of the day..."),
          " ",
          error && !loading && ( // Error display
          window.SP_REACT.createElement("div", { style: { color: 'red', border: '1px solid red', padding: '10px', marginBottom: '10px' } },
              window.SP_REACT.createElement("h2", null, "Error:"),
              window.SP_REACT.createElement("p", null, error))),
          verseOfTheDay && !loading && (window.SP_REACT.createElement("div", null,
              window.SP_REACT.createElement("h2", null, verseOfTheDay.citation),
              window.SP_REACT.createElement("p", null, verseOfTheDay.passage),
              window.SP_REACT.createElement("p", null,
                  window.SP_REACT.createElement("em", null,
                      "Version: ",
                      verseOfTheDay.version)),
              verseOfTheDay.images.length > 0 && (window.SP_REACT.createElement("div", null,
                  window.SP_REACT.createElement("h3", null, "Images:"),
                  window.SP_REACT.createElement("div", { style: { display: 'flex', flexDirection: 'column' } }, verseOfTheDay.images.map((image, index) => (window.SP_REACT.createElement("img", { key: index, src: image, alt: `Image ${index + 1}`, style: { maxWidth: '100%', marginBottom: '10px' } }))))))))));
  };
  var index = deckyFrontendLib.definePlugin((serverAPI) => {
      return {
          title: window.SP_REACT.createElement("div", { className: deckyFrontendLib.staticClasses.Title }, "YouVersion"),
          content: window.SP_REACT.createElement(Content, { serverAPI: serverAPI }),
          icon: window.SP_REACT.createElement(FaBible, null),
      };
  });

  return index;

})(DFL, SP_REACT);
