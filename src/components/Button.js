import React from 'react'
import LoadingButton from '@mui/lab/LoadingButton';
import {
	//alpha,
	styled
} from '@mui/material/styles';

const TextButton = styled(LoadingButton)(({theme}) => ({
	textTransform: 'none',
	padding: '6px 18px',
	'&:hover': {
		color: theme.palette.text.accent,
	},
}))

const StyledButton = styled(LoadingButton)(({theme}) => ({
	textTransform: 'none',
	borderColor: 'linear-gradient(90deg, #681DDB 0%, #D82633 100%)'
}))

export default function CustomButton({
	variant = 'outlined',
	fontSize = '0.875rem',
	...props
}) {
	return variant === 'outlined' ? 
		<StyledButton variant={variant} color='accent' {...props} sx={{fontSize: fontSize, ...props.sx}} /> :
			<TextButton variant={variant} {...props} sx={{fontSize: fontSize, ...props.sx}}/>
}