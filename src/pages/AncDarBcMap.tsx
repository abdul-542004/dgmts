import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import HeaNavLogo from '../components/HeaNavLogo';
import MainContentWrapper from '../components/MainContentWrapper';
import { Box, Typography } from '@mui/material';
import { LatLngTuple } from 'leaflet';

const AncDarBcMap = () => {
  const position: LatLngTuple = [38.869580, -77.061299]; // ANC DAR-BC coordinates
  
  // Style options for the instrument location
  const instrumentOptions = { 
    fillColor: 'red',
    color: 'red', 
    fillOpacity: 0.5,
    radius: 500 // Circle radius in meters
  };

  return (
    <>
      <HeaNavLogo />
      <MainContentWrapper>
        <Box p={3}>
          <Typography variant="h4" gutterBottom>ANC DAR-BC Project Location</Typography>
          
          <Box sx={{ 
            height: '500px', 
            width: '100%',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid #ddd'
          }}>
            <MapContainer 
              center={position} 
              zoom={17}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {/* Single location with all instruments */}
              <Circle 
                center={position}
                pathOptions={instrumentOptions}
                radius={20}
              >
                <Popup>
                  <div>
                    <strong>ANC DAR-BC Monitoring Station</strong><br/>
                    Instruments: 2 Seismographs, 1 Tiltmeter<br/>
                    Status: Active
                  </div>
                </Popup>
              </Circle>
            </MapContainer>
          </Box>
          
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              ANC DAR-BC Project | Coordinates: {position.join(', ')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Monitoring Station: 2 Seismographs, 1 Tiltmeter 
            </Typography>
          </Box>
        </Box>
      </MainContentWrapper>
    </>
  );
};

export default AncDarBcMap;
