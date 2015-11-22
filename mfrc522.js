
function MFRC522(){
  var NRSTPD = 22,
  
  MAX_LEN = 16,
  
  PCD_IDLE       = 0x00,
  PCD_AUTHENT    = 0x0E,
  PCD_RECEIVE    = 0x08,
  PCD_TRANSMIT   = 0x04,
  PCD_TRANSCEIVE = 0x0C,
  PCD_RESETPHASE = 0x0F,
  PCD_CALCCRC    = 0x03,
  
  PICC_REQIDL    = 0x26,
  PICC_REQALL    = 0x52,
  PICC_ANTICOLL  = 0x93,
  PICC_SElECTTAG = 0x93,
  PICC_AUTHENT1A = 0x60,
  PICC_AUTHENT1B = 0x61,
  PICC_READ      = 0x30,
  PICC_WRITE     = 0xA0,
  PICC_DECREMENT = 0xC0,
  PICC_INCREMENT = 0xC1,
  PICC_RESTORE   = 0xC2,
  PICC_TRANSFER  = 0xB0,
  PICC_HALT      = 0x50,
  
  MI_OK       = 0,
  MI_NOTAGERR = 1,
  MI_ERR      = 2,
  
  Reserved00     = 0x00,
  CommandReg     = 0x01,
  CommIEnReg     = 0x02,
  DivlEnReg      = 0x03,
  CommIrqReg     = 0x04,
  DivIrqReg      = 0x05,
  ErrorReg       = 0x06,
  Status1Reg     = 0x07,
  Status2Reg     = 0x08,
  FIFODataReg    = 0x09,
  FIFOLevelReg   = 0x0A,
  WaterLevelReg  = 0x0B,
  ControlReg     = 0x0C,
  BitFramingReg  = 0x0D,
  CollReg        = 0x0E,
  Reserved01     = 0x0F,
  
  Reserved10     = 0x10,
  ModeReg        = 0x11,
  TxModeReg      = 0x12,
  RxModeReg      = 0x13,
  TxControlReg   = 0x14,
  TxAutoReg      = 0x15,
  TxSelReg       = 0x16,
  RxSelReg       = 0x17,
  RxThresholdReg = 0x18,
  DemodReg       = 0x19,
  Reserved11     = 0x1A,
  Reserved12     = 0x1B,
  MifareReg      = 0x1C,
  Reserved13     = 0x1D,
  Reserved14     = 0x1E,
  SerialSpeedReg = 0x1F,
  
  Reserved20        = 0x20,  
  CRCResultRegM     = 0x21,
  CRCResultRegL     = 0x22,
  Reserved21        = 0x23,
  ModWidthReg       = 0x24,
  Reserved22        = 0x25,
  RFCfgReg          = 0x26,
  GsNReg            = 0x27,
  CWGsPReg          = 0x28,
  ModGsPReg         = 0x29,
  TModeReg          = 0x2A,
  TPrescalerReg     = 0x2B,
  TReloadRegH       = 0x2C,
  TReloadRegL       = 0x2D,
  TCounterValueRegH = 0x2E,
  TCounterValueRegL = 0x2F,
  
  Reserved30      = 0x30,
  TestSel1Reg     = 0x31,
  TestSel2Reg     = 0x32,
  TestPinEnReg    = 0x33,
  TestPinValueReg = 0x34,
  TestBusReg      = 0x35,
  AutoTestReg     = 0x36,
  VersionReg      = 0x37,
  AnalogTestReg   = 0x38,
  TestDAC1Reg     = 0x39,
  TestDAC2Reg     = 0x3A,
  TestADCReg      = 0x3B,
  Reserved31      = 0x3C,
  Reserved32      = 0x3D,
  Reserved33      = 0x3E,
  Reserved34      = 0x3F,
    
  serNum = [],
  
  this.__init__();
  

}

  MFRC522.prototype.__init__(){
    spi.openSPI(speed=spd)
    GPIO.setmode(GPIO.BOARD)
    GPIO.setup(22, GPIO.OUT)
    GPIO.output(this.NRSTPD, 1)
    this.MFRC522_Init()
  }

  MFRC522.prototype.MFRC522_Reset = function(){
    this.Write_MFRC522(this.CommandReg, this.PCD_RESETPHASE);
  }
  
  MFRC522.prototype.Write_MFRC522 = function(addr,val){
    spi.transfer(((addr<<1)&0x7E,val))
  }
  
  MFRC522.prototype.Read_MFRC522 = function(addr){
    var val = spi.transfer((((addr<<1)&0x7E) | 0x80,0));
    return val[1];
  }

  MFRC522.prototype.SetBitMask = function(reg, mask){
    var tmp = this.Read_MFRC522(reg);
    this.Write_MFRC522(reg, tmp || mask);
  }

  MFRC522.prototype.ClearBitMask = function(reg, mask){
    var tmp = this.Read_MFRC522(reg);
    this.Write_MFRC522(reg, tmp & (~mask));
  }

  MFRC522.prototype.AntennaOn = function(){
    var temp = this.Read_MFRC522(this.TxControlReg);
    if(!(temp && 0x03)){
      this.SetBitMask(this.TxControlReg, 0x03);
    }
  }

  MFRC522.prototype.AntennaOff = function(){
    this.ClearBitMask(this.TxControlReg, 0x03);
  }
  
  MFRC522.prototype.MFRC522_ToCard = function(command,sendData){
    var backData = [],
    backLen = 0,
    status = this.MI_ERR,
    irqEn = 0x00,
    waitIRq = 0x00,
    lastBits = null,
    n = 0,
    i = 0;
    
    if command == this.PCD_AUTHENT:
      irqEn = 0x12
      waitIRq = 0x10
    if command == this.PCD_TRANSCEIVE:
      irqEn = 0x77
      waitIRq = 0x30
    
    this.Write_MFRC522(this.CommIEnReg, irqEn|0x80)
    this.ClearBitMask(this.CommIrqReg, 0x80)
    this.SetBitMask(this.FIFOLevelReg, 0x80)
    
    this.Write_MFRC522(this.CommandReg, this.PCD_IDLE);  
    
    while(i<len(sendData)):
      this.Write_MFRC522(this.FIFODataReg, sendData[i])
      i = i+1
    
    this.Write_MFRC522(this.CommandReg, command)
      
    if command == this.PCD_TRANSCEIVE:
      this.SetBitMask(this.BitFramingReg, 0x80)
    
    i = 2000
    while True:
      n = this.Read_MFRC522(this.CommIrqReg)
      i = i - 1
      if ~((i!=0) and ~(n&0x01) and ~(n&waitIRq)):
        break
    
    this.ClearBitMask(this.BitFramingReg, 0x80)
  
    if i != 0:
      if (this.Read_MFRC522(this.ErrorReg) & 0x1B)==0x00:
        status = this.MI_OK

        if n & irqEn & 0x01:
          status = this.MI_NOTAGERR
      
        if command == this.PCD_TRANSCEIVE:
          n = this.Read_MFRC522(this.FIFOLevelReg)
          lastBits = this.Read_MFRC522(this.ControlReg) & 0x07
          if lastBits != 0:
            backLen = (n-1)*8 + lastBits
          else:
            backLen = n*8
          
          if n == 0:
            n = 1
          if n > this.MAX_LEN:
            n = this.MAX_LEN
    
          i = 0
          while i<n:
            backData.append(this.Read_MFRC522(this.FIFODataReg))
            i = i + 1;
      else:
        status = this.MI_ERR

    return (status,backData,backLen)
  }
  
  MFRC522.prototype.MFRC522_Request = function(self, reqMode){
    status = None
    backBits = None
    TagType = []
    
    this.Write_MFRC522(this.BitFramingReg, 0x07)
    
    TagType.append(reqMode);
    (status,backData,backBits) = this.MFRC522_ToCard(this.PCD_TRANSCEIVE, TagType)
  
    if ((status != this.MI_OK) | (backBits != 0x10)):
      status = this.MI_ERR
      
    return (status,backBits)
  }
  
  MFRC522.prototype.MFRC522_Anticoll = function(){
    backData = []
    serNumCheck = 0
    
    serNum = []
  
    this.Write_MFRC522(this.BitFramingReg, 0x00)
    
    serNum.append(this.PICC_ANTICOLL)
    serNum.append(0x20)
    
    (status,backData,backBits) = this.MFRC522_ToCard(this.PCD_TRANSCEIVE,serNum)
    
    if(status == this.MI_OK):
      i = 0
      if len(backData)==5:
        while i<4:
          serNumCheck = serNumCheck ^ backData[i]
          i = i + 1
        if serNumCheck != backData[i]:
          status = this.MI_ERR
      else:
        status = this.MI_ERR
  
    return (status,backData)
  }

  MFRC522.prototype.CalulateCRC = function(pIndata){
    this.ClearBitMask(this.DivIrqReg, 0x04)
    this.SetBitMask(this.FIFOLevelReg, 0x80);
    i = 0
    while i<len(pIndata):
      this.Write_MFRC522(this.FIFODataReg, pIndata[i])
      i = i + 1
    this.Write_MFRC522(this.CommandReg, this.PCD_CALCCRC)
    i = 0xFF
    while True:
      n = this.Read_MFRC522(this.DivIrqReg)
      i = i - 1
      if not ((i != 0) and not (n&0x04)):
        break
    pOutData = []
    pOutData.append(this.Read_MFRC522(this.CRCResultRegL))
    pOutData.append(this.Read_MFRC522(this.CRCResultRegM))
    return pOutData
  }

  MFRC522.prototype.MFRC522_SelectTag = function(serNum){
    backData = []
    buf = []
    buf.append(this.PICC_SElECTTAG)
    buf.append(0x70)
    i = 0
    while i<5:
      buf.append(serNum[i])
      i = i + 1
    pOut = this.CalulateCRC(buf)
    buf.append(pOut[0])
    buf.append(pOut[1])
    (status, backData, backLen) = this.MFRC522_ToCard(this.PCD_TRANSCEIVE, buf)
    
    if (status == this.MI_OK) and (backLen == 0x18):
      print "Size: " + str(backData[0])
      return    backData[0]
    else:
      return 0
  }

  MFRC522.prototype.MFRC522_Auth = function(authMode, BlockAddr, Sectorkey, serNum){
    buff = []

    # First byte should be the authMode (A or B)
    buff.append(authMode)

    # Second byte is the trailerBlock (usually 7)
    buff.append(BlockAddr)

    # Now we need to append the authKey which usually is 6 bytes of 0xFF
    i = 0
    while(i < len(Sectorkey)):
      buff.append(Sectorkey[i])
      i = i + 1
    i = 0

    # Next we append the first 4 bytes of the UID
    while(i < 4):
      buff.append(serNum[i])
      i = i +1

    # Now we start the authentication itself
    (status, backData, backLen) = this.MFRC522_ToCard(this.PCD_AUTHENT,buff)

    # Check if an error occurred
    if not(status == this.MI_OK):
      print "AUTH ERROR!!"
    if not (this.Read_MFRC522(this.Status2Reg) & 0x08) != 0:
      print "AUTH ERROR(status2reg & 0x08) != 0"

    # Return the status
    return status
  }

  MFRC522.prototype.MFRC522_StopCrypto1 = function(){
    this.ClearBitMask(this.Status2Reg, 0x08)
  }

  MFRC522.prototype.MFRC522_Read(blockAddr){
    recvData = []
    recvData.append(this.PICC_READ)
    recvData.append(blockAddr)
    pOut = this.CalulateCRC(recvData)
    recvData.append(pOut[0])
    recvData.append(pOut[1])
    (status, backData, backLen) = this.MFRC522_ToCard(this.PCD_TRANSCEIVE, recvData)
    if not(status == this.MI_OK):
      print "Error while reading!"
    i = 0
    if len(backData) == 16:
      print "Sector "+str(blockAddr)+" "+str(backData)
  }

  MFRC522.prototype.MFRC522_Write = function(blockAddr, writeData){
    buff = []
    buff.append(this.PICC_WRITE)
    buff.append(blockAddr)
    crc = this.CalulateCRC(buff)
    buff.append(crc[0])
    buff.append(crc[1])
    (status, backData, backLen) = this.MFRC522_ToCard(this.PCD_TRANSCEIVE, buff)
    if not(status == this.MI_OK) or not(backLen == 4) or not((backData[0] & 0x0F) == 0x0A):
        status = this.MI_ERR
    
    print str(backLen)+" backdata &0x0F == 0x0A "+str(backData[0]&0x0F)
    if status == this.MI_OK:
        i = 0
        buf = []
        while i < 16:
            buf.append(writeData[i])
            i = i + 1
        crc = this.CalulateCRC(buf)
        buf.append(crc[0])
        buf.append(crc[1])
        (status, backData, backLen) = this.MFRC522_ToCard(this.PCD_TRANSCEIVE,buf)
        if not(status == this.MI_OK) or not(backLen == 4) or not((backData[0] & 0x0F) == 0x0A):
            print "Error while writing"
        if status == this.MI_OK:
            print "Data written"
}

  MFRC522.prototype.MFRC522_DumpClassic1K = function(key, uid){
    i = 0
    while i < 64:
        status = this.MFRC522_Auth(this.PICC_AUTHENT1A, i, key, uid)
        # Check if authenticated
        if status == this.MI_OK:
            this.MFRC522_Read(i)
        else:
            print "Authentication error"
        i = i+1
}
  MFRC522.prototype.MFRC522_Init = function(){
    GPIO.output(this.NRSTPD, 1)
  
    this.MFRC522_Reset();
    
    
    this.Write_MFRC522(this.TModeReg, 0x8D)
    this.Write_MFRC522(this.TPrescalerReg, 0x3E)
    this.Write_MFRC522(this.TReloadRegL, 30)
    this.Write_MFRC522(this.TReloadRegH, 0)
    
    this.Write_MFRC522(this.TxAutoReg, 0x40)
    this.Write_MFRC522(this.ModeReg, 0x3D)
    this.AntennaOn()
  }