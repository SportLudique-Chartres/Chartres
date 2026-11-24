# Annexes
Toutes les annexes sont réunies sur cette page.
## Schéma Logique

![Schéma Logique Actuelle](img/schema_logique.png)


<br>

## Schéma Mana

![Schéma Mana](img/schema_mana.png) 
<br>

## Schéma Physique

![Schéma Physique](img/schema_physique.png)
<br>

## Plage IP Site

|          | Reseau       | Broadcast      |
|----------|--------------|----------------|
| Chartres | 172.28.160.0 | 172.28.191.255 |
| Bourges  | 172.28.192.0 | 172.28.223.255 |
| Tours    | 172.28.64.0  | 172.28.127.255 |
| Orleans  | 172.28.128.0 | 172.28.159.255 |
| Blois    | 172.28.32.0  | 172.28.63.255  |


<br>
## Plan d'adressage IP

| Nom | Vlan | IP | Passerelle |
|:---:|:----:|:--:| :--: |
| MANA | 120 | 10.28.2.0/28 |   |
| SERVEUR | 220 | 172.28.220.0/24 | 172.28.220.254 |
| CLIENT | 221 | 172.28.221.0/24 | 172.28.221.254 |
| WAN | 222 | 192.168.222.0/24 | 192.168.222.1 |
| LAN | 223 | 192.168.223.0/24 | 192.168.223.1 |
| DMZ_EXT | 224 | 192.168.224.0/24 | 192.168.224.254 |
| DMZ_INT | 225 | 192.168.225.0/24  | 192.168.225.254 |


<br>
## Plan De Brassage

| SW-Chartres | Ports | VLAN |
|:-:|:-:|:-:|
| R1-CHA | Gig0/1 | Trunk (MANA / WAN) |
| R2-CHA | Gig0/2 | Trunk (MANA / WAN) |
| FW-WAN | Gig0/3 | WAN |
| FW-LAN | Gig0/4 | Trunk (MANA / WAN) |
| | Gig0/5 | Trunk (DMZ_INT/DMZ_EXT) | 
| | Gig0/6 | |
| | Gig0/7 | |
| | Gig0/8 | |
| | Gig0/9 | |
| | Gig0/10 | |
| | Gig0/11 | |
| | Gig0/12 | |
| | Gig0/13 | |
| | Gig0/14 | |
| | Gig0/15 | |
| | Gig0/16 | |
| | Gig0/17 | |
| | Gig0/18 | |
| | Gig0/19 | CLIENTS |
| | Gig0/20 | SERVEUR |
| | Gig0/21 | MANA |
| | Gig0/22 | MANA |
| | Gig0/23 | LACP |
| | Gig0/24 | LACP |
| | Gi0/1 | |
| | Gi0/2 | |
