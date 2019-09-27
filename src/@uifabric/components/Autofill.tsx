import { getNativeProps, inputProperties, IRefObject, KeyCodes } from "@uifabric/styleguide"
import * as React from "react"

export interface IAutofillState {
  displayValue?: string
}

const SELECTION_FORWARD = "forward"
const SELECTION_BACKWARD = "backward"

export class Autofill extends React.Component<IAutofillProps, IAutofillState> implements IAutofill {
  public static defaultProps = {
    //down and up
    enableAutofillOnKeyPress: [40, 38]
  }

  private _inputElement = React.createRef<HTMLInputElement>()
  private _autoFillEnabled = true
  private _value: string

  constructor(props: IAutofillProps) {
    super(props)
    this._value = props.defaultVisibleValue || ""
    this.state = {
      displayValue: props.defaultVisibleValue || ""
    }
  }

  public get cursorLocation(): number | null {
    if (this._inputElement.current) {
      const inputElement = this._inputElement.current
      if (inputElement.selectionDirection !== SELECTION_FORWARD) {
        return inputElement.selectionEnd
      } else {
        return inputElement.selectionStart
      }
    } else {
      return -1
    }
  }

  public get isValueSelected(): boolean {
    return Boolean(this.inputElement && this.inputElement.selectionStart !== this.inputElement.selectionEnd)
  }

  public get value(): string {
    return this._value
  }

  public get selectionStart(): number | null {
    return this._inputElement.current ? this._inputElement.current.selectionStart : -1
  }

  public get selectionEnd(): number | null {
    return this._inputElement.current ? this._inputElement.current.selectionEnd : -1
  }

  public get inputElement(): HTMLInputElement | null {
    return this._inputElement.current
  }

  public UNSAFE_componentWillReceiveProps(nextProps: IAutofillProps): void {
    let newValue

    if (this.props.updateValueInWillReceiveProps) {
      newValue = this.props.updateValueInWillReceiveProps()
    }

    newValue = this._getDisplayValue(newValue ? newValue : this._value, nextProps.suggestedDisplayValue)

    if (typeof newValue === "string") {
      this.setState({ displayValue: newValue })
    }
  }

  public componentDidUpdate() {
    const value = this._value
    const { suggestedDisplayValue, shouldSelectFullInputValueInComponentDidUpdate, preventValueSelection } = this.props
    let differenceIndex = 0

    if (preventValueSelection) {
      return
    }

    if (this._autoFillEnabled && value && suggestedDisplayValue && this._doesTextStartWith(suggestedDisplayValue, value)) {
      let shouldSelectFullRange = false

      if (shouldSelectFullInputValueInComponentDidUpdate) {
        shouldSelectFullRange = shouldSelectFullInputValueInComponentDidUpdate()
      }

      if (shouldSelectFullRange && this._inputElement.current) {
        this._inputElement.current.setSelectionRange(0, suggestedDisplayValue.length, SELECTION_BACKWARD)
      } else {
        while (
          differenceIndex < value.length &&
          value[differenceIndex].toLocaleLowerCase() === suggestedDisplayValue[differenceIndex].toLocaleLowerCase()
        ) {
          differenceIndex++
        }
        if (differenceIndex > 0 && this._inputElement.current) {
          this._inputElement.current.setSelectionRange(differenceIndex, suggestedDisplayValue.length, SELECTION_BACKWARD)
        }
      }
    }
  }

  public render(): JSX.Element {
    const { displayValue } = this.state
    const nativeProps = getNativeProps(this.props, inputProperties)
    return (
      <input
        {...nativeProps}
        ref={this._inputElement}
        value={displayValue}
        autoCapitalize={"off"}
        autoComplete={"off"}
        onCompositionStart={this._onCompositionStart}
        onCompositionEnd={this._onCompositionEnd}
        onChange={this._onChanged}
        onInput={this._onInputChanged}
        onKeyDown={this._onKeyDown}
        onClick={this.props.onClick ? this.props.onClick : this._onClick}
        data-lpignore={true}
      />
    )
  }

  public focus() {
    this._inputElement.current && this._inputElement.current.focus()
  }

  public clear() {
    this._autoFillEnabled = true
    this._updateValue("")
    this._inputElement.current && this._inputElement.current.setSelectionRange(0, 0)
  }

  // Composition events are used when the character/text requires several keystrokes to be completed.
  // Some examples of this are mobile text input and langauges like Japanese or Arabic.
  // Find out more at https://developer.mozilla.org/en-US/docs/Web/Events/compositionstart
  private _onCompositionStart = (ev: React.CompositionEvent<HTMLInputElement>) => {
    this._autoFillEnabled = false
  }

  // Composition events are used when the character/text requires several keystrokes to be completed.
  // Some examples of this are mobile text input and langauges like Japanese or Arabic.
  // Find out more at https://developer.mozilla.org/en-US/docs/Web/Events/compositionstart
  private _onCompositionEnd = (ev: React.CompositionEvent<HTMLInputElement>) => {
    const inputValue = this._getCurrentInputValue()
    this._tryEnableAutofill(inputValue, this.value, false, true)
    // Korean characters typing issue has been addressed in React 16.5
    // TODO: revert back below lines when we upgrade to React 16.5
    // Find out at https://github.com/facebook/react/pull/12563/commits/06524c6c542c571705c0fd7df61ac48f3d5ce244
    const isKorean = (ev.nativeEvent as any).locale === "ko"
    // Due to timing, this needs to be async, otherwise no text will be selected.
    //this._async
    window.setTimeout(() => {
      const updatedInputValue = isKorean ? this.value : inputValue
      this._updateValue(updatedInputValue)
    }, 0)
  }

  private _onClick = () => {
    if (this._value && this._value !== "" && this._autoFillEnabled) {
      this._autoFillEnabled = false
    }
  }

  private _onKeyDown = (ev: React.KeyboardEvent<HTMLInputElement>) => {
    if (this.props.onKeyDown) {
      this.props.onKeyDown(ev)
    }

    // If the event is actively being composed, then don't alert autofill.
    // Right now typing does not have isComposing, once that has been fixed any should be removed.
    if (!(ev.nativeEvent as any).isComposing) {
      switch (ev.which) {
        case KeyCodes.backspace:
          this._autoFillEnabled = false
          break
        case KeyCodes.left:
        case KeyCodes.right:
          if (this._autoFillEnabled) {
            this._value = this.state.displayValue!
            this._autoFillEnabled = false
          }
          break
        default:
          if (!this._autoFillEnabled) {
            if (this.props.enableAutofillOnKeyPress!.indexOf(ev.which) !== -1) {
              this._autoFillEnabled = true
            }
          }
          break
      }
    }
  }

  private _onInputChanged = (ev: React.FormEvent<HTMLElement>) => {
    const value: string = this._getCurrentInputValue(ev)

    // Right now typing does not have isComposing, once that has been fixed any should be removed.
    this._tryEnableAutofill(value, this._value, (ev.nativeEvent as any).isComposing)
    this._updateValue(value)
  }

  private _onChanged = (): void => {
    // Swallow this event, we don't care about it
    // We must provide it because React PropTypes marks it as required, but onInput serves the correct purpose
    return
  }

  private _getCurrentInputValue(ev?: React.FormEvent<HTMLElement>): string {
    if (ev && ev.target && (ev.target as any).value) {
      return (ev.target as any).value
    } else if (this.inputElement && this.inputElement.value) {
      return this.inputElement.value
    } else {
      return ""
    }
  }

  /**
   * Attempts to enable autofill. Whether or not autofill is enabled depends on the input value,
   * whether or not any text is selected, and only if the new input value is longer than the old input value.
   * Autofill should never be set to true if the value is composing. Once compositionEnd is called, then
   * it should be completed.
   * See https://developer.mozilla.org/en-US/docs/Web/API/CompositionEvent for more information on composition.
   * @param newValue - new input value
   * @param oldValue - old input value
   * @param isComposing - if true then the text is actively being composed and it has not completed.
   * @param isComposed - if the text is a composed text value.
   */
  private _tryEnableAutofill(newValue: string, oldValue: string, isComposing?: boolean, isComposed?: boolean): void {
    if (
      !isComposing &&
      newValue &&
      this._inputElement.current &&
      this._inputElement.current.selectionStart === newValue.length &&
      !this._autoFillEnabled &&
      (newValue.length > oldValue.length || isComposed)
    ) {
      this._autoFillEnabled = true
    }
  }

  private _notifyInputChange(newValue: string): void {
    if (this.props.onInputValueChange) {
      this.props.onInputValueChange(newValue)
    }
  }

  /**
   * Updates the current input value as well as getting a new display value.
   * @param newValue - The new value from the input
   */
  private _updateValue = (newValue: string) => {
    // Only proceed if the value is nonempty and is different from the old value
    // This is to work around the fact that, in IE 11, inputs with a placeholder fire an onInput event on focus
    if (!newValue && newValue === this._value) {
      return
    }
    this._value = this.props.onInputChange ? this.props.onInputChange(newValue) : newValue
    this.setState(
      {
        displayValue: this._getDisplayValue(this._value, this.props.suggestedDisplayValue)
      },
      () => this._notifyInputChange(this._value)
    )
  }

  /**
   * Returns a string that should be used as the display value.
   * It evaluates this based on whether or not the suggested value starts with the input value
   * and whether or not autofill is enabled.
   * @param inputValue - the value that the input currently has.
   * @param suggestedDisplayValue - the possible full value
   */
  private _getDisplayValue(inputValue: string, suggestedDisplayValue?: string): string {
    let displayValue = inputValue
    if (suggestedDisplayValue && inputValue && this._doesTextStartWith(suggestedDisplayValue, displayValue) && this._autoFillEnabled) {
      displayValue = suggestedDisplayValue
    }
    return displayValue
  }

  private _doesTextStartWith(text: string, startWith: string): boolean {
    if (!text || !startWith) {
      return false
    }
    return text.toLocaleLowerCase().indexOf(startWith.toLocaleLowerCase()) === 0
  }
}

/**
 *  @deprecated do not use.
 * {@docCategory Autofill}
 */
export class BaseAutoFill extends Autofill {}

/**
 * {@docCategory Autofill}
 */
export interface IAutofill {
  /**
   * The current index of the cursor in the input area. Returns -1 if the input element
   * is not ready.
   */
  cursorLocation: number | null
  /**
   * A boolean for whether or not there is a value selected in the input area.
   */
  isValueSelected: boolean
  /**
   * The current text value that the user has entered.
   */
  value: string
  /**
   * The current index of where the selection starts. Returns -1 if the input element
   * is not ready.
   */
  selectionStart: number | null
  /**
   * the current index of where the selection ends. Returns -1 if the input element
   * is not ready.
   */
  selectionEnd: number | null
  /**
   * The current input element.
   */
  inputElement: HTMLInputElement | null
  /**
   * Focus the input element.
   */
  focus(): void
  /**
   * Clear all text in the input. Sets value to '';
   */
  clear(): void
}

/**
 * {@docCategory Autofill}
 */
export interface IAutofillProps extends React.InputHTMLAttributes<HTMLInputElement | Autofill> {
  /**
   * Gets the compoonent ref.
   */
  componentRef?: IRefObject<IAutofill>

  /**
   * The suggested autofill value that will display.
   */
  suggestedDisplayValue?: string

  /**
   * A callback for when the current input value changes.
   */
  onInputValueChange?: (newValue?: string) => void

  /**
   * When the user uses left arrow, right arrow, clicks, or deletes text autofill is disabled
   * Since the user has taken control. It is automatically reenabled when the user enters text and the
   * cursor is at the end of the text in the input box. This specifies other key presses that will reenabled
   * autofill.
   * @defaultvalue [KeyCodes.down, KeyCodes.up]
   */
  enableAutofillOnKeyPress?: KeyCodes[]

  /**
   * The default value to be visible. This is different from placeholder
   * because it actually sets the current value of the picker
   * Note: This will only be set upon component creation
   * and will not update with subsequent prop updates.
   */
  defaultVisibleValue?: string

  /**
   * Handler for checking and updating the value if needed
   * in componentWillReceiveProps
   *
   * @param defaultVisibleValue - The defaultVisibleValue that got passed
   *  in to the auto fill's componentWillReceiveProps
   * @returns - the updated value to set, if needed
   */
  updateValueInWillReceiveProps?: () => string | null

  /**
   * Handler for checking if the full value of the input should
   * be seleced in componentDidUpdate
   *
   * @returns - should the full value of the input be selected?
   */
  shouldSelectFullInputValueInComponentDidUpdate?: () => boolean

  /**
   * A callback used to modify the input string.
   */
  onInputChange?: (value: string) => string

  /**
   * Should the value of the input be selected? True if we're focused on our input, false otherwise.
   * We need to explicitly not select the text in the autofill if we are no longer focused.
   * In IE11, selecting a input will also focus the input, causing other element's focus to be stolen.
   */
  preventValueSelection?: boolean
}

/**
 * Deprecated, do not use.
 * @deprecated do not use, will be removed in 6.0
 * {@docCategory Autofill}
 */
export interface IBaseAutoFill extends IAutofill {}

/**
 * Deprecated, do not use.
 * @deprecated do not use, will be removed in 6.0
 * {@docCategory Autofill}
 */
export interface IBaseAutoFillProps extends IAutofillProps {}
