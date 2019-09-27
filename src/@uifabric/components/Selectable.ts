import { IRefObject, IRenderFunction } from "@uifabric/styleguide"
import * as React from "react"
import { ICalloutProps } from "./Callout"
import { IPanelProps } from "./Panel"

export interface ISelectableOption {
  /**
   * Arbitrary string associated with this option.
   */
  key: string | number

  /**
   * Text to render for this option
   */
  text: string

  /**
   * Title attribute (built in tooltip) for a given option.
   */
  title?: string

  /**
   * Text to render for this option
   */
  itemType?: SelectableOptionMenuItemType

  /**
   * Index for this option
   */
  index?: number

  /**
   * The aria label for the dropdown option. If not present, the `text` will be used.
   */
  ariaLabel?: string

  /** If option is selected. */
  selected?: boolean

  /**
   * Whether the option is disabled
   * @defaultvalue false
   */
  disabled?: boolean

  /**
   * Defines whether the option is hidden or not.
   * @defaultvalue false
   */
  hidden?: boolean

  /**
   * Data available to custom onRender functions.
   */
  data?: any
}

export enum SelectableOptionMenuItemType {
  Normal = 0,
  Divider = 1,
  Header = 2
}

/**
 * TComponent - Component used for reference properties, such as componentRef
 * TListenerElement - Listener element associated with HTML event callbacks. Optional. If not provided, TComponent is assumed.
 */
export interface ISelectableDroppableTextProps<TComponent, TListenerElement> extends React.HTMLAttributes<TListenerElement> {
  /**
   * Optional callback to access the ISelectableDroppableText interface. Use this instead of ref for accessing
   * the public methods and properties of the component.
   */
  componentRef?: IRefObject<TComponent>

  /**
   * Descriptive label for the ISelectableDroppableText
   */
  label?: string

  /**
   * Aria Label for the ISelectableDroppableText for screen reader users.
   */
  ariaLabel?: string

  /**
   * Id of the ISelectableDroppableText
   */
  id?: string

  /**
   * If provided, additional class name to provide on the root element.
   */
  className?: string

  /**
   * The key(s) that will be initially used to set a selected item.
   */
  defaultSelectedKey?: string | number | string[] | number[] | null

  /**
   * The key(s) of the selected item. If you provide this, you must maintain selection
   * state by observing onChange events and passing a new value in when changed.
   * Note that passing in `null` will cause selection to be reset.
   */
  selectedKey?: string | number | string[] | number[] | null

  /**
   * Collection of options for this ISelectableDroppableText
   */
  options?: any

  /**
   * Optional custom renderer for the ISelectableDroppableText container
   */
  onRenderContainer?: IRenderFunction<ISelectableDroppableTextProps<TComponent, TListenerElement>>

  /**
   * Optional custom renderer for the ISelectableDroppableText list
   */
  onRenderList?: IRenderFunction<ISelectableDroppableTextProps<TComponent, TListenerElement>>

  /**
   * Optional custom renderer for the ISelectableDroppableText options
   */
  onRenderItem?: IRenderFunction<ISelectableOption>

  /**
   * Optional custom renderer for the ISelectableDroppableText option content
   */
  onRenderOption?: IRenderFunction<ISelectableOption>

  /**
   * Whether or not the ISelectableDroppableText is disabled.
   */
  disabled?: boolean

  /**
   * Whether or not the ISelectableDroppableText is required.
   */
  required?: boolean

  /**
   * Custom properties for ISelectableDroppableText's Callout used to render options.
   */
  calloutProps?: ICalloutProps

  /**
   * Custom properties for ISelectableDroppableText's Panel used to render options on small devices.
   */
  panelProps?: IPanelProps

  /**
   * Descriptive label for the ISelectableDroppableText Error Message
   */
  errorMessage?: string

  /**
   * Input placeholder text. Displayed until option is selected.
   */
  placeholder?: string

  /**
   * Whether or not the combobox should expand on keyboard focus
   * @default false
   */
  openOnKeyboardFocus?: boolean
}
