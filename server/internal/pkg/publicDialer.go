package pkg

import (
	"errors"
	"net"
	"syscall"
	"time"
)

var ErrBlockedAddress = errors.New("address is not a public web address")

// Ranges that net.IP's own predicates don't cover: CGNAT, benchmarking, documentation, reserved, NAT64.
var blockedNetworks = mustParseCIDRs(
	"0.0.0.0/8", "100.64.0.0/10", "192.0.0.0/24", "192.0.2.0/24", "198.18.0.0/15", "198.51.100.0/24",
	"203.0.113.0/24", "240.0.0.0/4", "255.255.255.255/32", "64:ff9b::/96", "64:ff9b:1::/48", "2001:db8::/32",
)

func mustParseCIDRs(cidrs ...string) []*net.IPNet {
	networks := make([]*net.IPNet, 0, len(cidrs))
	for _, cidr := range cidrs {
		_, network, err := net.ParseCIDR(cidr)
		if err != nil {
			panic(err)
		}
		networks = append(networks, network)
	}
	return networks
}

// IsPublicIP reports whether ip is a globally routable unicast address; IPv4-mapped IPv6 is judged as IPv4
func IsPublicIP(ip net.IP) bool {
	if ip == nil {
		return false
	}
	if ip4 := ip.To4(); ip4 != nil {
		ip = ip4
	}
	if ip.IsLoopback() || ip.IsPrivate() || ip.IsLinkLocalUnicast() || ip.IsLinkLocalMulticast() ||
		ip.IsInterfaceLocalMulticast() || ip.IsMulticast() || ip.IsUnspecified() {
		return false
	}
	for _, network := range blockedNetworks {
		if network.Contains(ip) {
			return false
		}
	}
	return true
}

// PublicDialer refuses any connection that isn't to a public address on port 80 or 443, checked on the
// address actually dialed, so DNS rebinding between the pre-flight check and the dial can't slip through
func PublicDialer() *net.Dialer {
	return &net.Dialer{Timeout: 5 * time.Second, KeepAlive: 30 * time.Second, Control: publicOnlyControl}
}

func publicOnlyControl(_, address string, _ syscall.RawConn) error {
	host, port, err := net.SplitHostPort(address)
	if err != nil {
		return ErrBlockedAddress
	}
	if port != "80" && port != "443" {
		return ErrBlockedAddress
	}
	if !IsPublicIP(net.ParseIP(host)) {
		return ErrBlockedAddress
	}
	return nil
}
