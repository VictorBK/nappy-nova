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
// import { createUser, getUnreadNotifications, markNotificationAsRead, getUserByEmail, getUserBalance } from "@/utils/db/actions"

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
    const isMobile = useMediaQuery("(max-width: 768px)")
    const [balance, setBalance] = useState(0)

    useEffect(()=>{
        const init = async () => {
            setLoggedIn(true);
                  const user = await web3auth.getUserInfo();
                  setUserInfo(user);
                  if (user.email) {
                    localStorage.setItem('userEmail', user.email);
                    try {
                      await createUser(user.email, user.name || 'Anonymous User')
                    }
                }
            } catch (error) {
                      
                }
                
    })
 
