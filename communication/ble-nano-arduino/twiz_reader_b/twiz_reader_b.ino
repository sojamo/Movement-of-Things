/** 
 *  Twiz Reader 
 *  The Twiz Reader is an Arduino based program that runs on a BLE Nano Kit
 *  Bluetooth 4.0 LE Board that connects to a computer via USB.
 *  This reader looks for Twiz devices and connects when found. 
 *  Currently the reader supports 1 Twiz at a time. When connected, the 
 *  incoming data is converted to a string message:
 *  
 *  TwizCE2=ef:80:f0:96:bd:96:53:8b:0a:36:89:7c
 *  
 *  which is forwarded to an application listening on the reader's serial port.
 *  more detailed function descriptions see twiz_reader_a
 */



#include <BLE_API.h>
#include <ble/Gap.h>

BLE ble;

/* Twiz service */
UUID service_uuid(0x1901); 

/* Twiz data characteristic */
UUID chars_uuid(0x2b01);


String twizId = "";

static uint8_t device_is_hrm = 0;
static uint8_t device_is_simple_peripheral = 0;

// When found the match characteristic, set 1.
static uint8_t characteristic_is_fond = 0;

// When found the match descriptor, set 1.
static uint8_t descriptor_is_found = 0;

// To save the hrm characteristic and descriptor
static DiscoveredCharacteristic chars_hrm;
static DiscoveredCharacteristicDescriptor  desc_of_chars_hrm(NULL, GattAttribute::INVALID_HANDLE, GattAttribute::INVALID_HANDLE, UUID::ShortUUIDBytes_t(0));

static void scanCallBack(const Gap::AdvertisementCallbackParams_t *params);
static void discoveredServiceCallBack(const DiscoveredService *service);
static void discoveredCharacteristicCallBack(const DiscoveredCharacteristic *chars);
static void discoveryTerminationCallBack(Gap::Handle_t connectionHandle);
static void discoveredCharsDescriptorCallBack(const CharacteristicDescriptorDiscovery::DiscoveryCallbackParams_t *params);
static void discoveredDescTerminationCallBack(const CharacteristicDescriptorDiscovery::TerminationCallbackParams_t *params) ;

/** @brief  Function to decode advertisement or scan response data */
uint32_t ble_advdata_parser(uint8_t type, uint8_t advdata_len, uint8_t *p_advdata, uint8_t *len, uint8_t *p_field_data) {
  uint8_t index = 0;
  uint8_t field_length, field_type;

  while (index < advdata_len) {
    field_length = p_advdata[index];
    field_type   = p_advdata[index + 1];
    if (field_type == type) {
      memcpy(p_field_data, &p_advdata[index + 2], (field_length - 1));
      *len = field_length - 1;
      return NRF_SUCCESS;
    }
    index += field_length + 1;
  }
  return NRF_ERROR_NOT_FOUND;
}

void startDiscovery(uint16_t handle) {
  if (device_is_hrm)
    ble.gattClient().launchServiceDiscovery(handle, discoveredServiceCallBack, discoveredCharacteristicCallBack, service_uuid, chars_uuid);
  if (device_is_simple_peripheral)
    ble.gattClient().launchServiceDiscovery(handle, discoveredServiceCallBack, discoveredCharacteristicCallBack);
}

/** @brief  Callback handle for scanning device */
static void scanCallBack(const Gap::AdvertisementCallbackParams_t *params) {
  uint8_t index;
  uint8_t len;
  uint8_t adv_name[31];
  if ( NRF_SUCCESS == ble_advdata_parser(BLE_GAP_AD_TYPE_COMPLETE_LOCAL_NAME, params->advertisingDataLen, (uint8_t *)params->advertisingData, &len, adv_name) ) {
    if (memcmp("Twiz", adv_name, 4) == 0x00) {
      twizId = (const char*)adv_name;
      twizId = twizId.substring(0, 7);

      Serial.print("# Got a twiz=");
      Serial.print(twizId);
      Serial.println(", stop scanning ... ");
      ble.stopScan();
      device_is_hrm = 1;
      ble.gap().connect(params->peerAddr, BLEProtocol::AddressType::RANDOM_STATIC, NULL, NULL);
    }
  }
}

/** @brief  Connection callback handle */
void connectionCallBack( const Gap::ConnectionCallbackParams_t *params ) {
  /* adjust connection parameters and listen for incoming data at a 40ms update-rate, default is 125ms */
  Gap::Handle_t gap_handle = params->handle;
  Gap::ConnectionParams_t new_params;
  new_params.minConnectionInterval = 10;
  new_params.maxConnectionInterval = 32; /* this will be the update-rate 32*1.25 = 40ms */
  new_params.connectionSupervisionTimeout = 3200;
  new_params.slaveLatency = 2;

  /* update the ble device with the update connection parameters */
  ble.gap().updateConnectionParams(gap_handle, &new_params);

  /* wait a bit to process the update */
  delay(500);

  /* start to discovery */
  startDiscovery(params->handle);
  Serial.print("@connect twiz=");
  Serial.print(twizId);
}

/** @brief  Disconnect callback handle */
void disconnectionCallBack(const Gap::DisconnectionCallbackParams_t *params) {
  Serial.print("@disconnect twiz=");
  Serial.print(twizId);
  device_is_simple_peripheral = 0;
  device_is_hrm = 0;
  characteristic_is_fond = 0;
  descriptor_is_found = 0;
  ble.startScan(scanCallBack);
}



/** unused */
static void discoveredServiceCallBack(const DiscoveredService *service) {}



/** @brief Discovered characteristics callback handle */
static void discoveredCharacteristicCallBack(const DiscoveredCharacteristic *chars) {
  if (chars->getUUID().shortOrLong() == UUID::UUID_TYPE_SHORT) {
    if (chars->getUUID().getShortUUID() == 0x2b01) {
      characteristic_is_fond = 1;
      chars_hrm = *chars;
    }
  }
}



/** @brief Discovered service and characteristics termination callback handle */
static void discoveryTerminationCallBack(Gap::Handle_t connectionHandle) {
  if (characteristic_is_fond == 1) {
    ble.gattClient().discoverCharacteristicDescriptors(chars_hrm, discoveredCharsDescriptorCallBack, discoveredDescTerminationCallBack);
  }
}



/** @brief Discovered descriptor of characteristic callback handle */
static void discoveredCharsDescriptorCallBack(const CharacteristicDescriptorDiscovery::DiscoveryCallbackParams_t *params) {
  if (params->descriptor.getUUID().getShortUUID() == 0x2902) {
    // Save characteristic info
    descriptor_is_found = 1;
    desc_of_chars_hrm = params->descriptor;
  }
}

/** @brief Discovered descriptor of characteristic termination callback handle */
static void discoveredDescTerminationCallBack(const CharacteristicDescriptorDiscovery::TerminationCallbackParams_t *params) {
  if (descriptor_is_found) {
    uint16_t value = 0x0001;
    ble.gattClient().write(GattClient::GATT_OP_WRITE_REQ, chars_hrm.getConnectionHandle(), desc_of_chars_hrm.getAttributeHandle(), 2, (uint8_t *)&value);
  }
}


/** @brief  hvx callback handle */
void hvxCallBack(const GattHVXCallbackParams *params) {
  const uint8_t n = 12;
  if (params->len == n) {
    String data = twizId + "=";
    uint8_t index;
    for (index = 0; index < n; index++) {
      data += params->data[index] < 16 ? "0" : "";
      data += String(params->data[index], 16);
      data += (index < n - 1) ? ":" : "";
    }
    Serial.println(data);
  }
}


void setup() {

  /* open a serial communication channel */
  Serial.begin(115200);
  Serial.println("# BLE Central. BLE Nano Kit, RedBearLab. twiz-server");

  /* start scanning */
  ble.init();
  ble.onConnection(connectionCallBack);
  ble.onDisconnection(disconnectionCallBack);
  ble.gattClient().onServiceDiscoveryTermination(discoveryTerminationCallBack);
  ble.gattClient().onHVX(hvxCallBack);

  /* start scanning */
  ble.setScanParams(100, 20, 0, false);
  ble.startScan(scanCallBack);
}

void loop() {
  ble.waitForEvent();
}


