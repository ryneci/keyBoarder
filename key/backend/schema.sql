CREATE TABLE Preset (
  presetid int NOT NULL AUTO_INCREMENT,
  presetName varchar(50) NOT NULL,
  waveshape varchar(10) NOT NULL,
  timedelay varchar(10) NOT NULL,
  dist int NOT NULL,
  oversample varchar(10) NOT NULL,
  PRIMARY KEY (presetid)
);