LE_META_EVENT = 0x3e
LE_PUBLIC_ADDRESS = 0x00
LE_RANDOM_ADDRESS = 0x01
LE_SET_SCAN_PARAMETERS_CP_SIZE = 7

OGF_LE_CTL = 0x08
OCF_LE_SET_SCAN_PARAMETERS = 0x000B
OCF_LE_SET_SCAN_ENABLE = 0x000C
OCF_LE_SET_RANDOM_ADDRESS = 0x0005

OCF_LE_CREATE_CONN = 0x000D

LE_ROLE_MASTER = 0x00
LE_ROLE_SLAVE = 0x01

# these are actually subevents of LE_META_EVENT
EVT_LE_CONN_COMPLETE = 0x01
EVT_LE_ADVERTISING_REPORT = 0x02
EVT_LE_CONN_UPDATE_COMPLETE = 0x03
EVT_LE_READ_REMOTE_USED_FEATURES_COMPLETE = 0x04

# Advertisment event types
ADV_IND = 0x00
ADV_DIRECT_IND = 0x01
ADV_SCAN_IND = 0x02
ADV_NONCONN_IND = 0x03
ADV_SCAN_RSP = 0x04

# attributes requests
# taken from bluez att.h
ATT_OP_ERROR = 0x01
ATT_OP_MTU_REQ = 0x02
ATT_OP_MTU_RESP = 0x03
ATT_OP_FIND_INFO_REQ = 0x04
ATT_OP_FIND_INFO_RESP = 0x05
ATT_OP_FIND_BY_TYPE_REQ = 0x06
ATT_OP_FIND_BY_TYPE_RESP = 0x07
ATT_OP_READ_BY_TYPE_REQ = 0x08
ATT_OP_READ_BY_TYPE_RESP = 0x09
ATT_OP_READ_REQ = 0x0A
ATT_OP_READ_RESP = 0x0B
ATT_OP_READ_BLOB_REQ = 0x0C
ATT_OP_READ_BLOB_RESP = 0x0D
ATT_OP_READ_MULTI_REQ = 0x0E
ATT_OP_READ_MULTI_RESP = 0x0F
ATT_OP_READ_BY_GROUP_REQ = 0x10
ATT_OP_READ_BY_GROUP_RESP = 0x11
ATT_OP_WRITE_REQ = 0x12
ATT_OP_WRITE_RESP = 0x13
ATT_OP_WRITE_CMD = 0x52

ATT_OP_PREP_WRITE_REQ = 0x16
ATT_OP_PREP_WRITE_RESP = 0x17
ATT_OP_EXEC_WRITE_REQ = 0x18
ATT_OP_EXEC_WRITE_RESP = 0x19
ATT_OP_HANDLE_NOTIFY = 0x1B
ATT_OP_HANDLE_IND = 0x1D
ATT_OP_HANDLE_CNF = 0x1E
ATT_OP_SIGNED_WRITE_CMD = 0xD2

ATT_DEFAULT_LE_MTU = 23

