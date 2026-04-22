import * as React from "react"

type PossibleRef<T> = React.Ref<T> | undefined

export function mergeRefs<T>(...refs: PossibleRef<T>[]) {
  return (value: T) => {
    for (const ref of refs) {
      if (!ref) continue
      if (typeof ref === "function") {
        ref(value)
      } else {
        ;(ref as React.MutableRefObject<T | null>).current = value
      }
    }
  }
}

