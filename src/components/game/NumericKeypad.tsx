export function NumericKeypad({
  value,
  onChange,
  onSubmit,
  allowDecimal = false,
  disabled = false,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  allowDecimal?: boolean
  disabled?: boolean
}) {
  const keys = allowDecimal
    ? ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0']
    : ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']

  return (
    <div className="keypad" aria-label="すうじきーぱっど">
      <output className="keypad-output" aria-label="にゅうりょくちゅうのこたえ">
        {value || ' '}
      </output>
      <div className="key-grid">
        {keys.map((key) => (
          <button
            className="key-button"
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => onChange(value + key)}
          >
            {key}
          </button>
        ))}
        <button
          className="key-button"
          type="button"
          disabled={disabled}
          onClick={() => onChange(value.slice(0, -1))}
        >
          けす
        </button>
        <button
          className="key-button key-submit"
          type="button"
          onClick={onSubmit}
          disabled={disabled || value.length === 0}
        >
          こたえる
        </button>
      </div>
    </div>
  )
}
