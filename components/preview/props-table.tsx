import type { ExtractedProp } from "@/lib/renderer/types";

export function PropsTable({ props }: { props: ExtractedProp[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-neutral-500 border-b border-neutral-800">
            <th className="pb-2 pr-4 font-medium">Prop</th>
            <th className="pb-2 pr-4 font-medium">Type</th>
            <th className="pb-2 pr-4 font-medium">Required</th>
            <th className="pb-2 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {props.map((prop) => (
            <tr key={prop.name} className="border-b border-neutral-800/50">
              <td className="py-2 pr-4 font-mono text-white">{prop.name}</td>
              <td className="py-2 pr-4 font-mono text-neutral-400 text-xs">{prop.type}</td>
              <td className="py-2 pr-4">
                {prop.required ? (
                  <span className="text-red-400">Yes</span>
                ) : (
                  <span className="text-neutral-600">No</span>
                )}
              </td>
              <td className="py-2 text-neutral-500">{prop.description || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
