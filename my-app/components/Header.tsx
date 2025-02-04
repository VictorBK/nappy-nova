// @ts-nocheck
'use client'
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Menu, Coins, Leaf, Search, Bell, User, ChevronDown, LogIn, LogOut } from "lucide-react"
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
  } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Web3Auth } from "@web3auth/modal"
import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base"
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider"
// import { useMediaQuery } from "@/hooks/useMediaQuery"
import { createUser, getUnreadNotifications, markNotificationAsRead, getUserByEmail, getUserBalance } from "@/utils/db/actions"

const clientId = process.env.WEB3_AUTH_CLIENT_ID 

const chainConfig = {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: "0xaa36a7",
    rpcTarget: "https://rpc.ankr.com/eth_sepolia",
    displayName: "Ethereum Sepolia Testnet",
    blockExplorerUrl: "https://sepolia.etherscan.io",
    ticker: "ETH",
    tickerName: "Ethereum",
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
 };

const privateKeyProvider = new EthereumPrivateKeyProvider({
    config: { chainConfig },
});

const web3auth = new Web3Auth({
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.TESTNET, // Changed from SAPPHIRE_MAINNET to TESTNET
    privateKeyProvider,
});

interface HeaderProps {
    onMenuClick: () => void;
    totalEarnings: number;
}

export default function Header({ onMenuClick, totalEarnings }: HeaderProps) {
    const [provider, setProvider] = useState<IProvider | null>(null);
    const [loggedIn, setLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState<any>(null);
    const pathname = usePathname()
    const [notifications, setNotifications] = useState<Notification[]>([]);
    // const isMobile = useMediaQuery("(max-width: 768px)")
    const [balance, setBalance] = useState(0)

    console.log('user info', userInfo);

    useEffect(() => {
        const init = async () => {
          try {
            await web3auth.initModal();
            setProvider(web3auth.provider);
    
            if (web3auth.connected) {
              setLoggedIn(true);
              const user = await web3auth.getUserInfo();
              setUserInfo(user);
              if (user.email) {
                localStorage.setItem('userEmail', user.email);
                try {
                  await createUser(user.email, user.name || 'Anonymous User');
                } catch (error) {
                  console.error("Error creating user:", error);
                  // Handle the error appropriately, maybe show a message to the user
                }
              }
            }
          } catch (error) {
            console.error("Error initializing Web3Auth:", error);
          } finally {
            setLoading(false);
          }
        };
    
        init();
    }, []);

    useEffect(() => {
        const fetchNotifications = async () => {
          if (userInfo && userInfo.email) {
            const user = await getUserByEmail(userInfo.email);
            if (user) {
              const unreadNotifications = await getUnreadNotifications(user.id);
              setNotifications(unreadNotifications);
            }
          }
        };
    
        fetchNotifications();
    
        // Set up periodic checking for new notifications
        const notificationInterval = setInterval(fetchNotifications, 30000); // Check every 30 seconds
    
        return () => clearInterval(notificationInterval);
      }, [userInfo]);

      useEffect(() => {
        const fetchUserBalance = async () => {
          if (userInfo && userInfo.email) {
            const user = await getUserByEmail(userInfo.email);
            if (user) {
              const userBalance = await getUserBalance(user.id);
              setBalance(userBalance);
            }
          }
        };

        fetchUserBalance();

        // Add an event listener for balance updates
    const handleBalanceUpdate = (event: CustomEvent) => {
        setBalance(event.detail);
      };
  
      window.addEventListener('balanceUpdated', handleBalanceUpdate as EventListener);
  
      return () => {
        window.removeEventListener('balanceUpdated', handleBalanceUpdate as EventListener);
      };
    }, [userInfo]);

    const login = async () => {
        if (!web3auth) {
          console.log("web3auth not initialized yet");
          return;
        }
        try {
          const web3authProvider = await web3auth.connect();
          setProvider(web3authProvider);
          setLoggedIn(true);
          const user = await web3auth.getUserInfo();
          setUserInfo(user);
          if (user.email) {
            localStorage.setItem('userEmail', user.email);
            try {
              await createUser(user.email, user.name || 'Anonymous User');
            } catch (error) {
              console.error("Error creating user:", error);
              // Handle the error appropriately, maybe show a message to the user
            }
          }
        } catch (error) {
          console.error("Error during login:", error);
        }
      };

      const logout = async () => {
        if (!web3auth) {
          console.log("web3auth not initialized yet");
          return;
        }
        try {
          await web3auth.logout();
          setProvider(null);
          setLoggedIn(false);
          setUserInfo(null);
          localStorage.removeItem('userEmail');
        } catch (error) {
          console.error("Error during logout:", error);
        }
      };

      const getUserInfo = async () => {
        if (web3auth.connected) {
          const user = await web3auth.getUserInfo();
          setUserInfo(user);
          if (user.email) {
            localStorage.setItem('userEmail', user.email);
            try {
              await createUser(user.email, user.name || 'Anonymous User');
            } catch (error) {
              console.error("Error creating user:", error);
              // Handle the error appropriately, maybe show a message to the user
            }
          }
        }
      };

      const handleNotificationClick = async (notificationId: number) => {
        await markNotificationAsRead(notificationId);
        setNotifications(prevNotifications => 
          prevNotifications.filter(notification => notification.id !== notificationId)
        );
      };

      if (loading) {
        return <div>Loading Web3Auth...</div>;
      }

      return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="mr-2 md:mr-4"
                onClick={onMenuClick}>
                  <Menu className="h-6 w-6" />
                  </Button>
            </div> 
          </div>
        </header>
      );    
}


