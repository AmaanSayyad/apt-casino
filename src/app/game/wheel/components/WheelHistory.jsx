"use client";

import React, { useState } from "react";
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Select, MenuItem, FormControl, Pagination, Fade } from "@mui/material";
import { FaHistory, FaTrophy, FaChartLine, FaExternalLinkAlt } from "react-icons/fa";
import PlayChainIcon from '@/components/play/PlayChainIcon';
import { gameHistoryProofHref, gameHistoryProofLabel } from '@/lib/provablyFair/explorerLinks';
import { usePlayCurrency } from '@/hooks/usePlayCurrency';

const WheelHistory = ({ gameHistory = [] }) => {
  const { symbol, chain } = usePlayCurrency();
  const [entriesShown, setEntriesShown] = useState(10);
  const [page, setPage] = useState(1);

  // Open proof / explorer link for transaction hash
  const openProofLink = (item) => {
    const href = gameHistoryProofHref({
      chain,
      txHash: item.txHash,
      explorerUrl: item.explorerUrl,
    });
    if (href) window.open(href, '_blank');
  };

  // Use real game history data from props instead of sample data
  const historyData = gameHistory.length > 0 ? gameHistory : [];
  const filteredHistory = historyData;

  // Stats calculation from real data
  const totalBets = historyData.length;
  const totalVolume = historyData.reduce((sum, item) => sum + (parseFloat(item.betAmount) || 0), 0);
  const biggestWin = historyData.length > 0 ? Math.max(...historyData.map(item => parseFloat(item.payout) || 0)) : 0;

  // Pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const paginatedHistory = filteredHistory.slice((page - 1) * entriesShown, page * entriesShown);
  const totalPages = Math.ceil(filteredHistory.length / entriesShown);

  return (
    <Paper
      elevation={5}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 3,
        background: 'linear-gradient(135deg, rgba(9, 0, 5, 0.9) 0%, rgba(25, 5, 30, 0.85) 100%)',
        backdropFilter: 'blur(15px)',
        border: '1px solid rgba(104, 29, 219, 0.2)',
        mb: 5,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        height: '100%',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '5px',
          background: 'linear-gradient(90deg, #681DDB, #14D854)',
        }
      }}
    >
      <Typography
        variant="h5"
        fontWeight="bold"
        gutterBottom
        sx={{
          borderBottom: '1px solid rgba(104, 29, 219, 0.3)',
          pb: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          color: 'white',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)'
        }}
      >
        <FaHistory color="#681DDB" size={22} />
        <span style={{ background: 'linear-gradient(90deg, #FFFFFF, #681DDB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Game History
        </span>
      </Typography>

      <Typography
        variant="body2"
        color="rgba(255,255,255,0.7)"
        sx={{ mb: 3 }}
      >
        Recent game results and statistics
      </Typography>

      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', md: 'center' },
        mb: 3,
        gap: 2
      }}>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 2,
          width: '100%'
        }}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: 'rgba(104, 29, 219, 0.1)',
              border: '1px solid rgba(104, 29, 219, 0.2)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Typography variant="caption" color="rgba(255,255,255,0.5)" sx={{ mb: 0.5 }}>
              Total Bets
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" fontWeight="bold" color="white">
                {totalBets}
              </Typography>
              <FaChartLine color="rgba(104, 29, 219, 0.8)" />
            </Box>
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: 'rgba(255, 165, 0, 0.1)',
              border: '1px solid rgba(255, 165, 0, 0.2)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Typography variant="caption" color="rgba(255,255,255,0.5)" sx={{ mb: 0.5 }}>
              Total Volume
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" fontWeight="bold" color="white" sx={{
                maxWidth: '80%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {totalVolume.toFixed(5)} {symbol}
              </Typography>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <PlayChainIcon chain={chain} size={20} />
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: 'rgba(20, 216, 84, 0.1)',
              border: '1px solid rgba(20, 216, 84, 0.2)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Typography variant="caption" color="rgba(255,255,255,0.5)" sx={{ mb: 0.5 }}>
              Biggest Win
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" fontWeight="bold" color="white" sx={{
                maxWidth: '80%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {biggestWin.toFixed(5)} {symbol}
              </Typography>
              <FaTrophy color="#FFA500" />
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: { xs: '100%', md: '120px' } }}>
          <Select
            value={entriesShown}
            onChange={(e) => setEntriesShown(Number(e.target.value))}
            sx={{
              color: 'white',
              backgroundColor: 'rgba(0,0,0,0.2)',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(104, 29, 219, 0.2)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(104, 29, 219, 0.3)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(104, 29, 219, 0.5)',
              },
              '& .MuiSelect-icon': {
                color: 'rgba(255,255,255,0.5)',
              },
            }}
          >
            <MenuItem value={10}>Show 10</MenuItem>
            <MenuItem value={20}>Show 20</MenuItem>
            <MenuItem value={50}>Show 50</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer
        sx={{
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: 2,
          border: '1px solid rgba(104, 29, 219, 0.2)',
          mb: 3,
          maxHeight: '500px',
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(104, 29, 219, 0.3)',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: 'rgba(104, 29, 219, 0.5)',
            },
          },
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  color: 'white',
                  fontWeight: 'bold',
                  borderBottom: '1px solid rgba(104, 29, 219, 0.2)'
                }}
              >
                Game
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  color: 'white',
                  fontWeight: 'bold',
                  borderBottom: '1px solid rgba(104, 29, 219, 0.2)'
                }}
              >
                Time
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  color: 'white',
                  fontWeight: 'bold',
                  borderBottom: '1px solid rgba(104, 29, 219, 0.2)'
                }}
              >
                Bet Amount
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  color: 'white',
                  fontWeight: 'bold',
                  borderBottom: '1px solid rgba(104, 29, 219, 0.2)'
                }}
              >
                Multiplier
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  color: 'white',
                  fontWeight: 'bold',
                  borderBottom: '1px solid rgba(104, 29, 219, 0.2)'
                }}
              >
                Payout
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  color: 'white',
                  fontWeight: 'bold',
                  borderBottom: '1px solid rgba(104, 29, 219, 0.2)'
                }}
              >
                Result
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  color: 'white',
                  fontWeight: 'bold',
                  borderBottom: '1px solid rgba(104, 29, 219, 0.2)'
                }}
              >
                TX
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedHistory.map((item, index) => (
              <Fade
                in={true}
                key={item.id}
                style={{
                  transformOrigin: '0 0 0',
                  transitionDelay: `${index * 50}ms`
                }}
              >
                <TableRow
                  sx={{
                    '&:nth-of-type(odd)': {
                      backgroundColor: 'rgba(0,0,0,0.1)'
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(104, 29, 219, 0.1)'
                    },
                    transition: 'background-color 0.2s'
                  }}
                >
                  <TableCell
                    sx={{
                      color: 'white',
                      borderBottom: '1px solid rgba(104, 29, 219, 0.1)'
                    }}
                  >
                    {item.game || 'Wheel'}
                  </TableCell>
                  <TableCell
                    sx={{
                      color: 'rgba(255,255,255,0.7)',
                      borderBottom: '1px solid rgba(104, 29, 219, 0.1)'
                    }}
                  >
                    {item.time}
                  </TableCell>
                  <TableCell
                    sx={{
                      borderBottom: '1px solid rgba(104, 29, 219, 0.1)'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography
                        variant="body2"
                        color="rgba(255,255,255,0.7)"
                        sx={{
                          maxWidth: '80px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {item.betAmount} {symbol}
                      </Typography>
                      <PlayChainIcon chain={chain} size={16} />
                    </Box>
                  </TableCell>
                  <TableCell
                    sx={{
                      color: 'white',
                      fontWeight: 'medium',
                      borderBottom: '1px solid rgba(104, 29, 219, 0.1)'
                    }}
                  >
                    {item.multiplier}
                  </TableCell>
                  <TableCell
                    sx={{
                      borderBottom: '1px solid rgba(104, 29, 219, 0.1)'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography
                        variant="body2"
                        color="#FFA500"
                        fontWeight="medium"
                        sx={{
                          maxWidth: '80px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {item.payout} {symbol}
                      </Typography>
                      <PlayChainIcon chain={chain} size={16} />
                    </Box>
                  </TableCell>
                  <TableCell
                    sx={{
                      color: item.payout > 0 ? '#14D854' : '#d82633',
                      fontWeight: 'medium',
                      borderBottom: '1px solid rgba(104, 29, 219, 0.1)'
                    }}
                  >
                    {item.payout > 0 ? `+${item.payout}` : '0'}
                  </TableCell>
                  <TableCell
                    sx={{
                      borderBottom: '1px solid rgba(104, 29, 219, 0.1)'
                    }}
                  >
                    {item.txHash ? (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          cursor: 'pointer',
                          '&:hover': {
                            opacity: 0.8
                          }
                        }}
                        onClick={() => openProofLink(item)}
                      >
                        <Typography
                          variant="body2"
                          color="#4A9EFF"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            maxWidth: '80px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {item.txHash.slice(0, 8)}...
                        </Typography>
                        <FaExternalLinkAlt size={10} color="#4A9EFF" />
                      </Box>
                    ) : (
                      <Typography
                        variant="body2"
                        color="rgba(255,255,255,0.5)"
                        sx={{ fontSize: '0.75rem' }}
                      >
                        Pending
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              </Fade>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredHistory.length === 0 && (
        <Box
          sx={{
            py: 4,
            textAlign: 'center',
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: 2,
            border: '1px solid rgba(104, 29, 219, 0.2)',
            mb: 3
          }}
        >
          <Typography color="rgba(255,255,255,0.5)">
            No game history yet.
          </Typography>
        </Box>
      )}

      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography variant="body2" color="rgba(255,255,255,0.5)">
          Showing {Math.min(entriesShown, filteredHistory.length)} of {filteredHistory.length} results
        </Typography>

        {totalPages > 1 && (
          <Pagination
            count={totalPages}
            page={page}
            onChange={handleChangePage}
            variant="outlined"
            shape="rounded"
            sx={{
              '& .MuiPaginationItem-root': {
                color: 'rgba(255,255,255,0.7)',
                borderColor: 'rgba(104, 29, 219, 0.2)',
                '&.Mui-selected': {
                  backgroundColor: 'rgba(104, 29, 219, 0.3)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(104, 29, 219, 0.4)',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(104, 29, 219, 0.1)',
                },
              },
            }}
          />
        )}
      </Box>
    </Paper>
  );
};

export default WheelHistory; 
