export function generateSandboxHtml(
  componentCode: string,
  previewCode: string,
  dependencies: string[],
  cssVariables?: string,
): string {
  const cdnUrls: Record<string, string> = {
    react: "https://esm.sh/react@18",
    "react-dom/client": "https://esm.sh/react-dom@18/client",
    "@radix-ui/react-slot": "https://esm.sh/@radix-ui/react-slot",
    "class-variance-authority": "https://esm.sh/class-variance-authority",
    clsx: "https://esm.sh/clsx",
    "tailwind-merge": "https://esm.sh/tailwind-merge",
    "lucide-react": "https://esm.sh/lucide-react",
  };

  const importMap = dependencies
    .filter((dep) => cdnUrls[dep])
    .reduce((acc, dep) => {
      acc[dep] = cdnUrls[dep];
      return acc;
    }, {} as Record<string, string>);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script type="importmap">
    {
      "imports": ${JSON.stringify(
        {
          react: "https://esm.sh/react@18",
          "react-dom/client": "https://esm.sh/react-dom@18/client",
          ...importMap,
        },
        null,
        2,
      )}
    }
  </script>
  <style>
    ${cssVariables || ""}

    body {
      margin: 0;
      padding: 16px;
      font-family: system-ui, sans-serif;
      background: transparent;
    }

    .preview-container {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
    }
  </style>
</head>
<body>
  <div id="root"></div>

  <script type="module">
    import React from "react";
    import { createRoot } from "react-dom/client";

    ${componentCode}

    function Preview() {
      return React.createElement("div", { className: "preview-container" },
        ${previewCode}
      );
    }

    const root = createRoot(document.getElementById("root"));
    root.render(React.createElement(Preview));
  </script>
</body>
</html>
  `.trim();
}

export function transformJsxToCreateElement(jsx: string): string {
  let result = jsx;

  result = result.replace(/<(\w+)\s*\/>/g, "React.createElement($1, null)");

  result = result.replace(
    /<(\w+)\s+([^>]+)>([^<]*)<\/(\1)>/g,
    (match, tag, props, children) => {
      const propsObj = parsePropsString(props);
      return `React.createElement(${tag}, ${propsObj}, ${JSON.stringify(children)})`;
    },
  );

  result = result.replace(
    /<(\w+)>([^<]*)<\/(\1)>/g,
    (match, tag, children) => {
      return `React.createElement(${tag}, null, ${JSON.stringify(children)})`;
    },
  );

  return result;
}

function parsePropsString(propsStr: string): string {
  const props: string[] = [];

  const stringProps = propsStr.matchAll(/(\w+)="([^"]*)"/g);
  for (const match of stringProps) {
    props.push(`${match[1]}: ${JSON.stringify(match[2])}`);
  }

  const exprProps = propsStr.matchAll(/(\w+)=\{([^}]+)\}/g);
  for (const match of exprProps) {
    props.push(`${match[1]}: ${match[2]}`);
  }

  const boolProps = propsStr.matchAll(/(?:^|\s)(\w+)(?=\s|$)/g);
  for (const match of boolProps) {
    if (!propsStr.includes(`${match[1]}=`)) {
      props.push(`${match[1]}: true`);
    }
  }

  return `{ ${props.join(", ")} }`;
}
