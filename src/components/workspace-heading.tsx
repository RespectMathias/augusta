import { useEffect, useRef } from 'react'

export default function WorkspaceHeading({ id, children }: { id: string; children: string }) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    heading.current?.focus()
  }, [])
  return (
    <h2 id={id} ref={heading} tabIndex={-1}>
      {children}
    </h2>
  )
}
