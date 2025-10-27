import React, { useRef, useEffect } from 'react'
import {
	Box,
	Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2'; // Grid version 2
import {
	GameHomeAnimation,
	RouletteAnimation
} from '../../../lottie/LottieWraps'
import HoverSelectionCard from '../../common/HoverSelectionCard'

const BackgroundBox = styled(Box)(({ theme }) => ({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'stretch',
	background: 'linear-gradient(176deg, #121212 35%, #330e6d 55%, #121212 75%)'
}))

export default function GameSelection({ ...props }) {

	let rouletteRef = useRef()

	useEffect(() => {
		if (rouletteRef.current) {
			rouletteRef.current.goToAndStop(200, true)
			rouletteRef.current.setSpeed(2)
		}
	}, [])

	return (
		<BackgroundBox sx={{ mt: 5 }}>
			<Box sx={{ display: 'flex', mx: 10, justifyContent: 'center' }}>
				<Box sx={{ display: 'flex', flexDirection: 'column', pt: '50px' }}>
					<Typography variant='h3' color='text.accent'>Game Library</Typography>
					<Typography variant='h5' color='text.secondary' gutterBottom>Select. Play. Win.</Typography>
				</Box>
				<Box sx={{ minWidth: '200px' }}>
					<GameHomeAnimation style={{ height: '200px' }} />
				</Box>
			</Box>
			<Grid container spacing={2} sx={{ mt: 2, mx: 10 }}>
				<Grid md={4} xs={12} onMouseEnter={() => rouletteRef.current.goToAndPlay(0)} onMouseLeave={() => rouletteRef.current.goToAndStop(200, true)}>
					<HoverSelectionCard heading='Roulette' subheading='Fortune Awaits Your Spin' href='/game/roulette'>
						<Box sx={{ display: 'flex' }}>
							<Box sx={{ flex: 2, py: 2 }}>
								<Box sx={{ display: 'flex', flexDirection: 'column' }}>
									<Typography>24h play volume</Typography>
									<Box sx={{ display: 'flex', mt: 1, alignItems: 'center' }}>
										<Typography sx={{ mt: 1, fontSize: '1.6rem', ml: 1 }} gutterBottom>$100,000,000</Typography>
									</Box>
								</Box>
							</Box>
							<Box sx={{ flex: 1, maxWidth: '150px' }}>
								<RouletteAnimation ref={rouletteRef} autoplay={false} />
							</Box>
						</Box>
					</HoverSelectionCard>
				</Grid>
				<Grid md={4} xs={12}>
					<HoverSelectionCard href='/game/slots' heading="Slots" subheading="Test Your Jackpot Luck" disabled>
						<Box sx={{ display: 'flex' }}>
							<Box sx={{ flex: 1, py: 2 }}>
								<Typography>Coming Soon!</Typography>
							</Box>
						</Box>
					</HoverSelectionCard>
				</Grid>
			</Grid>
		</BackgroundBox>
	)
}