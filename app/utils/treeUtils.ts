export const getTreeImageForLevel = (level: number) => {
  let imageName: string;

  if (level <= 0) level = 1;

  if (level >= 10) {
    imageName = 'ICON-05.png';
  } else if (level >= 7) {
    imageName = 'ICON-04.png';
  } else if (level >= 5) {
    imageName = 'ICON-03.png';
  } else if (level >= 3) {
    imageName = 'ICON-02.png';
  } else { // levels 1-2
    imageName = 'ICON-01.png';
  }

  switch (imageName) {
    case 'ICON-01.png':
      return require('../../assets/images/trees/ICON-01.png');
    case 'ICON-02.png':
      return require('../../assets/images/trees/ICON-02.png');
    case 'ICON-03.png':
      return require('../../assets/images/trees/ICON-03.png');
    case 'ICON-04.png':
      return require('../../assets/images/trees/ICON-04.png');
    case 'ICON-05.png':
      return require('../../assets/images/trees/ICON-05.png');
    default:
      return require('../../assets/images/trees/ICON-01.png'); // Fallback
  }
}; 