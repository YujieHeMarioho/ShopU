const config = {
    "presets": [
      ["@babel/preset-env", {
        "targets": {
          "node": "current",
          "browsers": [">0.25%, not dead"]
        },
        "useBuiltIns": "usage",
        "corejs": 3
      }],
      ["@babel/preset-react", {
        "runtime": "automatic"
      }]
    ],
    "plugins": [
      "@babel/plugin-proposal-class-properties",
      "@babel/plugin-transform-runtime",
      "@babel/plugin-proposal-optional-chaining",
      "@babel/plugin-proposal-nullish-coalescing-operator"
    ],
    "env": {
      "test": {
        "presets": [
          ["@babel/preset-env", {
          }]
        ]
      }
    }
  };