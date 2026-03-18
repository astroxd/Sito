const month = new Date().getMonth();

export const getCurrentSeason = () => {
  switch (month) {
    case 11:
    case 0:
    case 1:
      return 'WINTER';
    case 2:
    case 3:
    case 4:
      return 'SPRING';
    case 5:
    case 6:
    case 7:
      return 'SUMMER';
    default:
      return 'FALL';
  }
};

export const getNextSeason = () => {
  switch (month) {
    case 11:
    case 0:
    case 1:
      return 'SPRING';
    case 2:
    case 3:
    case 4:
      return 'SUMMER';
    case 5:
    case 6:
    case 7:
      return 'FALL';
    default:
      return 'WINTER';
  }
};
