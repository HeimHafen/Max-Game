export const houseWidth=25;
export const houseFront=16;
export const houseRear=houseFront-houseWidth;
export const houseMiddle=(houseFront+houseRear)/2;
export const frontPartition=houseMiddle+2.35;
export const rearPartition=houseMiddle-2.35;
export const sideWindowCenters=[-6,-1.25,3.5,8.25,13];

export const terraceHalf=3.25;
export const terraceDepth=1.85;

export const rearRoomSplit=-1.85;
export const interiorPartitionThickness=.23;
// Midpoint between the finished faces of the partition and side wall.
export const terraceOffset=(rearRoomSplit+interiorPartitionThickness/2+houseWidth/2-.41)/2;
