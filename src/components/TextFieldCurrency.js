'use client';

import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import { NumericFormat } from 'react-number-format';
import PlayChainIcon from '@/components/play/PlayChainIcon';
import { usePlayCurrency } from '@/hooks/usePlayCurrency';

const NumericFormatCustom = React.forwardRef(
  function NumericFormatCustom(props, ref) {
    const { onChange, dollarPrefix = false, ...other } = props;

    return (
      <NumericFormat
        {...other}
        getInputRef={ref}
        onValueChange={(values) => {
          onChange({
            target: {
              name: props.name,
              value: values.value,
            },
          });
        }}
        thousandSeparator
        valueIsNumericString
        allowNegative={false}
        {...(dollarPrefix && { prefix: '$' })}
      />
    );
  },
);

export default function TextFieldCurrency({
  handleChange,
  dollarPrefix = false,
  label,
  ...props
}) {
  const { symbol, chain } = usePlayCurrency();
  const resolvedLabel =
    label === 'Bet Amount' || label === undefined
      ? `Bet Amount (${symbol})`
      : label;

  return (
    <TextField
      {...props}
      label={resolvedLabel}
      onChange={handleChange}
      name="numberformat"
      InputProps={{
        inputComponent: NumericFormatCustom,
        inputProps: { dollarPrefix },
        endAdornment: (
          <InputAdornment position="end">
            <PlayChainIcon chain={chain} size={22} />
          </InputAdornment>
        ),
        ...props.InputProps,
      }}
    />
  );
}
