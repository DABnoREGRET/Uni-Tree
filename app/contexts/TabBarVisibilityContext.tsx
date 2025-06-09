import React, { createContext, ReactNode, useContext, useState } from 'react';

export type ScrollDirection = 'up' | 'down' | 'none';

interface TabBarVisibilityContextType {
  isTabBarVisible: boolean;
  setIsTabBarVisible: (visible: boolean) => void;
  scrollY: number;
  setScrollY: (y: number) => void;
  scrollDirection: ScrollDirection;
  setScrollDirection: (direction: ScrollDirection) => void;
}

const TabBarVisibilityContext = createContext<TabBarVisibilityContextType | undefined>(
  undefined
);

export const TabBarVisibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isTabBarVisible, setIsTabBarVisible] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>('none');

  return (
    <TabBarVisibilityContext.Provider
      value={{
        isTabBarVisible,
        setIsTabBarVisible,
        scrollY,
        setScrollY,
        scrollDirection,
        setScrollDirection,
      }}
    >
      {children}
    </TabBarVisibilityContext.Provider>
  );
};

export const useTabBarVisibility = () => {
  const context = useContext(TabBarVisibilityContext);
  if (context === undefined) {
    throw new Error('useTabBarVisibility must be used within a TabBarVisibilityProvider');
  }
  return context;
}; 