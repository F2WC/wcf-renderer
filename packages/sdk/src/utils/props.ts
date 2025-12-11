import type { ConsoleWcfLogger } from '@/logger.js'
import type { ComponentAttributes, ComponentProps } from '@/types/index.js'

/**
 * Parses component props from the dataset attributes.
 * Returns undefined if no props are provided or if parsing fails.
 *
 * @param dataset The component's dataset containing the props attribute
 * @param logger Logger instance for warnings
 * @param mfeName The name of the MFE (for logging purposes)
 * @returns Parsed component props or undefined
 */
export function getComponentProps(
  dataset: ComponentAttributes,
  logger: ConsoleWcfLogger,
  mfeName: string,
): ComponentProps | undefined {
  if (dataset.props) {
    try {
      return JSON.parse(dataset.props) as ComponentProps
    } catch (e) {
      logger.warn(`Failed to parse props for MFE ${mfeName}: ${String(e)}`)
    }
  }
}
