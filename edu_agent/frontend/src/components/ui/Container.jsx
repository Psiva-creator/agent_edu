/**
 * Container — Consistent max-width layout wrapper.
 * Replaces the repeated `max-w-[1440px] xl:max-w-[1600px] 2xl:max-w-[1700px] mx-auto`
 * pattern used across every page and section.
 */
function Container({ children, className = '', as: Tag = 'div' }) {
  return (
    <Tag className={`max-w-[1440px] xl:max-w-[1600px] 2xl:max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-16 w-full ${className}`}>
      {children}
    </Tag>
  )
}

export default Container
