## <font color= 'red'> 1 - Configuration du switch </font>

Réinitialisation du switch `erase config-startup`, cette commande supprime toute la configuration précédente.

### 1.1 - Renommage du switch
```
 enable
 configure terminal
 hostname ‘nom du switch'
```
### 1.2 - Créer les différents VLANS nécessaires

`vlan [numéro du port]` puis `name [nom_du_VLAN]`

### 1.3 - Attribution des ports aux VLANS

```
interface [numéro du port]
switchport mode access/trunk
Switchport access vlan [numéro de vlan]
```

### 1.4 - Création d'un utilisateur

`username [admin] privilege 15 secret [password]`

### 1.5 - Mise en place du SSH

Et nous activons les interfaces avec la commande

```
ip domain name cha.chartres.sportludique.local
ip ssh version 2
crypto key generate-keys modulus 1024
line vty 0 4
login local
transport input ssh
write memory
```

### 1.6 - Modification du switch après la mise en place du Pare-Feu

Nous avons ajouté le VLAN 223 qui sera la DMZ.

Le port WAN (fa0/3) est en mode access.

Le port LAN est en trunk pour faire passer les VLAN Mana et LAN.

Nous mettons en place deux nouveaux réseaux d'interconnexion :
- le réseau d'interconnexion WAN, qui nous permettra de sortir sur Internet ;
- le réseau d'interconnexion LAN, qui nous permettra de séparer le LAN et le WAN.

Nous avons donc mis en place la nouvelle route par défaut, qui est la suivante : 0.0.0.0 0.0.0.0 192.168.223.254 ; elle va nous permettre de rediriger tous les paquets vers le pare-feu.

Exemple : je veux faire une recherche sur Internet, mon paquet passera par l'interconnexion LAN, et ensuite le pare-feu s'occupera de le distribuer à l'interconnexion WAN qui enverra le paquet sur internet

### Problème LACP

Nous souhaitions accéder à l'interface de management du serveur CHA-GUI1, le switch désactiver directement un port, nous ne pouvions pas accéder au serveur CHA-GUI1 via la VLAN Mana.

Lorsque nous avons établi le raccordement, nous avons constaté sur le switch Cisco que le port se désactivait ; nous avons conclu que le protocole Spanning Tree le désactivait à cause d'une potentielle boucle sur le réseau.

Nous avons désactivé temporairement le protocole Spanning Tree pour nous permettre de connaître l'origine de la boucle ou, à défaut, de voir si une boucle est bien présente.

Il s'est avéré qu'aucune boucle n'était présente sur notre réseau ; nous avons désactivé Spanning Tree et tout fonctionnait correctement.

Après deux longues heures de recherche minutieuse, nous avons trouvé une solution : la mise en place du protocole EtherChannel LACP avec les ports Gig1/0/23 et Gig1/0/24, qui transporteront uniquement les VLAN 120 et 220.

```
conf t

interface range GigabitEthernet1/0/23-24
 description LACP-ETHERCHANNEL
 switchport mode trunk
 switchport trunk allowed vlan 120,220
 channel-group 1 mode active
 no shutdown
 exit

interface Port-channel1
 description LACP-TRUNK
 switchport mode trunk
 switchport trunk allowed vlan 120,220
 no shutdown
 exit

end
write memory
```
Pour ensuite tester que notre solution fonctionne bien, nous avons remis en place le protocole Spanning Tree et nous avons testé l'accès au serveur CHA-GUI1 via son interface de Mana et le test fut un succès.

Nous supposons que l'erreur vient d'une mauvaise réinitialisation du switch.

### 1.7 - Configuration intégrale du SW-CHA

## <font color= 'red'> 2 - Configuration Routeur </font>

### 2.1 - Mise en place du NAT

Sur chaque routeur, nous mettons en place l'interface interne (LAN), qui comportera deux interfaces virtuelles :

- Interface du VLAN 120 `interface gig0/0.120` avec l'adresse IP `10.28.2.253 255.255.255.0` 

- Interface du VLAN 222 `ip address 192.168.222.254 255.255.255.0` et `ip nat inside` avec `l'encapsulation dot1Q`

Et nous aurons l'interface externe (WAN) :
```
ip address 221.87.128.1 255.255.255.252
ip nat outside
no shutdown
```

Route par défaut : `ip route 0.0.0.0 0.0.0.0 221.87.128.2` - elle nous donnera l'accès à Internet.

### 2.2 - Mise en place de l'accès internet sur les vlans

On met la route par défaut pour le switch : `0.0.0.0 0.0.0.0 192.168.222.254`

On met la route sur le routeur pour qu'il connaisse le VLAN 221: `172.28.161.0 255.255.255.0 192.168.222.1`

### 2.3 - Redirection de port vers la DMZ

Pour nous permettre d'accéder au serveur DNS depuis l'extérieur, nous avons paramétré une redirection de port avec la commande ci-dessous :
`ip nat inside source static udp 192.168.224.1 53 interface 221.87.128.1 53`

### 2.4 - Mise en place du 2eme Routeur

On met en place R2-CHA, pour assurer la haute disponibilité.

Nous pouvons réutilisé la précédente configuration, en changeant les IP.

On config HSRP sur les 2 routeurs

R1:
```
 standby 1 ip 192.168.222.253
 standby 1 priority 110
 standby 1 preempt
```

R2:
```
 standby 1 ip 192.168.222.252
 standby 1 priority 100
 standby 1 preempt
```

### 2.5 - Mise en place de la redirection de port pour un accès depuis l'extérieur aux services de la DMZ

Pour commencer, nous configurons la redirection vers le site web de la DMZ

CHA-WEB - 192.168.224.3

Nous entrons les commandes suivantes :

```
enable
configure terminal
ip nat inside source static tcp 192.168.224.3 80 interface GigabitEthernet0/1 80
ip nat inside source static tcp 192.168.224.3 443 interface GigabitEthernet0/1 443
end
write memory
```
Le port GigabitEthernet0/1 est notre interface WAN, ce qui va permettre de rediriger toutes les requêtes HTTP, HTTPS vers CHA-WEB.

## <font color= 'red'> 3 - Configuration de firewall </font>

### 3.1 - Mise a jour du firewall

Pour mettre le firewall à jour, il faut respecter ses étapes dans l'ordre :

- Mettre une date en 2025;
- redémarrer le firewall;
- installation de la licence;
- installation de la mise à jour via son fichier.

Après toutes ces étapes, définir l'heure du firewall avec le NTP.


### 3.2 - Mise en place des sous-interfaces

Nous désactivons l'interface « in » (interface physique) pour ensuite mettre en place les interfaces virtuelles, MANA puis LAN.

### 3.3 - Mise en place des routes

Nous avons mis en place la route permettant au pare-feu de renvoyer les paquets à tous les VLAN du réseau.
```
Dest : VLAN-INTERNE
Interface : lan
Plan adressage : 172.28.160.0/19
Passerelle : Pass-Serveur (192.168.223.1)
```
### 3.4 - Filtre et NAT

Nous avons, pour le moment, sélectionné le profil « block all » pour finaliser la configuration du réseau ; nous mettrons en place le filtrage dans un second temps.

## <font color= 'red'> 4 - Mise en place des serveurs </font>

### 4.1 - Installation du CHA-DC1 & CHA-GUI1

CHA-DC1 sera l'Active Directory : 172.28.160.1/24.

CHA-GUI1 sera le serveur d'administration : 172.28.160.2/24.

Pour les ressources allouées aux VM, nous serons sur 2 cœurs et 4 Go de RAM, elles sont déployées via un serveur Proxmox.

Nous avons mis les VM sur deux nœuds différents pour répartir les ressources allouées sur les différents nœuds.

On renomme les deux serveurs et on configure les interfaces réseau avant d'installer le rôle AD sur le serveur CHA-DC1.

### 4.2 - Configuration du rôle AD 

Le rôle AD sera mis en place en amont sur CHA-DC1.

Installation du rôle AD : 
```
Install-WindowsFeature AD-Domain-Services -IncludeManagementTools
Install-ADDSForest -DomainName "cha.chartres.sportludique.fr" -DomainNetbiosName "CHA" -InstallDNS
```

Ainsi, nous pourrons administrer ce serveur avec le serveur CHA-GUI1.

### 4.2 - Configuration de GUI1


Nous mettons en place CHA-GUI1, un Windows Server 2022 sous interface graphique, qui va nous permettre d'administrer CHA-DC1 avec une interface graphique.

Nous aurons la configuration suivante : 

Carte réseau 1 -> VLAN SERVEURS -> 172.28.160.2/24
Carte réseau 2 -> VLAN MANA -> 10.28.2.1

De suite, nous pourrons être dans le réseau de MANA, qui est isolé.


## <font color= 'red'> 5 - Mise en place du DNS PUBLIC - DMZ </font>

### 5.1 - Création de la VM

Nous allons déployer un DNS externe, CHA-DNS2, qui permettra aux utilisateurs d'accéder aux services publics (DMZ). Nous allons le mettre en place sous une VM Debian.

Nous utilisons le logiciel BIND9, un logiciel de serveur DNS qui est open source et qui est le plus utilisé au monde.

La configuration réseau sera la suivante :

Carte réseau 1 -> VLAN DMZ -> 192.168.224.1/24
Carte réseau 2 -> VLAN MANA -> 10.28.2.2/24

Nous installons ensuite BIND9 :
```
sudo apt update
sudo apt install bind9 bind9-utils dnsutils
```

### 5.2 - Configurer BIND comme DNS autoritatif uniquement

On édite le fichier suivant : `sudo nano /etc/bind/named.conf.options`

Puis on insère le fichier de configuration suivant :
```
options {
        directory "/var/cache/bind";

        listen-on {
            127.0.0.1; 
            192.168.224.1; 
};
        listen-on-v6 { none; };

        recursion no;

        allow-query { any; };
        allow-recursion { none; };

        allow-transfer { none; };

        version "not disclosed";

        dnssec-validation auto;
};
```

### 5.3 - Création de la zone chartres.sportludique.fr

On crée le fichier de configuration pour créer la zone : `sudo nano /etc/bind/zones/db.chartres.sportludique.fr`

Ensuite, nous le configurons de la manière suivante :
```
$TTL 3600

@   IN SOA ns.chartres.sportludique.fr. admin.chartres.sportludique.fr. (
2026101301
3600
900
604800
3600
)

@            IN NS      ns.chartres.sportludique.fr.

ns           IN A       221.87.128.1

@            IN A       221.87.128.1
www          IN A       221.87.128.1
```
Nous devons par la suite ajouter la redirection de port sur le routeur, pour permettre aux utilisateurs en dehors du LAN d'y accéder (voir 2.3).

Après avoir réalisé toutes ces étapes, nous pouvons donc tester l'accès depuis l'extérieur avec la commande suivante : `dig 221.87.128.1 www.chartres.sportludique.fr`

Et nous devons le résultat suivant :
```
administrateur@CHA-DNS2:/etc/bind/zones$ dig @121.183.90.205 www.chartres.sportludique.fr A 
;; communications error to 121.183.90.205#53: timed out 
 
; > DiG 9.20.29-1~deb13u1-Debian > @121.183.90.205 www.chartres.sportludique.fr A 
; (1 server found) 
;; global options: +cmd 
;; Got answer: 
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 29782 
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1 
 
;; OPT PSEUDOSECTION: 
; EDNS: version: 0, flags:; udp: 1232 
;; QUESTION SECTION: 
;www.chartres.sportludique.fr.  IN      A 
 
;; ANSWER SECTION: 
www.chartres.sportludique.fr. 3600 IN   A       221.87.128.1 
 
;; Query time: 11 msec 
;; SERVER: 121.183.90.205#53(121.183.90.205) (UDP) 
;; WHEN: Tue Oct 13 15:54:28 CEST 2026 
;; MSG SIZE  rcvd: 73
```
## 6 - Mise en place du DNS interne

Pour ce faire, nous avons créé une machine virtuelle sous Windows Server 2022 (Core).

Après la configuration et l'installation, nous l'avons jointe au domaine, puis nous avons pu  l'ajouter au serveur CHA-GUI1 pour nous permettre de l'administrer.

Nous avons installé le service DNS sur le serveur CHA-DNS1 ainsi que les outils d'administration à distance sur notre serveur CHA-GUI1.

Ensuite, nous avons créé la zone principale avec le nom `chartres.sportludique.fr`

Nous avons mis en place les enregistrements DNS vers la DMZ pour les serveurs DNS, mail et web.
Enfin, nous avons aussi configuré le redirecteur pour accéder à Internet depuis les différents VLAN en utilisant le serveur DNS interne.

## 7 - Mise en place du service web dans la DMZ 

Nous avons mis en place une VM Linux qui servira le rôle de serveur web.

Nous avons pu configurer les différents fichiers de configuration.

### 7.1 - Nous créons le contenu du site

```
sudo install -d -m 755 /var/www/sportludique-public
sudo nano /var/www/sportludique-public/index.html
```

Et nous configurons la première page du site avec du contenu.

### 7.2 - Définir le premier VirtualHost

Créez le fichier `/etc/apache2/sites-available/sportludique-public.conf`

Puis insérez le contenu suivant :

```
<VirtualHost *:80>
    ServerName www.chartres.sportludique.fr
    DocumentRoot /var/www/sportludique-public

    <Directory /var/www/sportludique-public>
        Options None
        AllowOverride None
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/sportludique-public_error.log
    CustomLog ${APACHE_LOG_DIR}/sportludique-public_access.log combined
</VirtualHost>
```

### 7.3 - On active le site et on contrôle la syntaxe

```
sudo a2ensite sportludique-public.conf
sudo apache2ctl configtest
```

Si le résultat indique `Syntax OK`, nous pouvons recharger la configuration du site :

```
sudo systemctl reload apache2
sudo apache2ctl -S
```

### 7.4 - Activer la redirection de port pour un accès depuis l'extérieur (voir 2.5)

### 7.5 - Créer l'autorité de certification de Chartres

1) Préparation de l'environnement de travail

Installation OpenSSL :

```
sudo apt update
sudo apt install openssl tree
```

2) Création d'un dossier pki-groupe en respectant donc l'arborescence :

```
pki-groupe/
├── autorite/
│   ├── certificats/
│   └── cles/
└── serveur/
    ├── certificats/
    ├── cles/
    └── demandes/
```

3) Génération d'une clé RSA 4096 bits, chiffrée avec une phrase de passe :

```
openssl genpkey -algorithm RSA -aes-256-cbc \
  -pkeyopt rsa_keygen_bits:4096 \
  -out autorite/cles/ca-chartres.key
```

4) Vérification de sa création :

```
ls -l autorite/cles/ca-chartres.key
openssl pkey -in autorite/cles/ca-chartres.key -noout -check
```

5) Création de la CSR de votre CA existante

```
mkdir -p autorite/demandes
 
openssl req -new -sha256 \
  -key autorite/cles/ca-chartres.key \
  -out autorite/demandes/ca-chartres.csr \
  -subj "/C=FR/O=SportLudique/CN=CA Chartres SportLudique"
 
openssl req -in autorite/demandes/ca-groupe.csr -noout -verify -text
```

Puis, transmettez uniquement `ca-chartres.csr` au prestataire (enseignant) ; le prestataire contrôlera la demande et signera avec les extensions d'une CA intermédiaire.

6) Récupérer et vérifier la confiance des certificats

Récupération du certificat public de la CA racine SportLudique et récupération de la CA intermédiaire signée par le prestataire.

Attention : vérifiez l'empreinte SHA-256 :

```
openssl x509 -in autorite/certificats/sportludique-root.crt.pem -noout -fingerprint -sha256
```

7) Vérification de la chaîne de confiance

Vérification des deux certificats récupérés de la CA racine :

```
openssl x509 -in autorite/certificats/sportludique-root.crt.pem \
  -noout -fingerprint -sha256
```

Vérifiez ensuite que le CA intermédiaire a bien été certifié par la CA racine SportLudique.

```
openssl verify \
  -CAfile autorite/certificats/sportludique-root.crt.pem \
  autorite/certificats/ca-intermediaire.crt
```

Résultat attendu :

```
autorite/certificats/ca-intermediaire.crt: OK
```

8) Découvrir le registre d'une CA

Préparer ce registre une seule fois, sans écraser un registre déjà utilisé :

```
mkdir -p autorite/newcerts autorite/crl
touch autorite/index.txt
openssl rand -hex 16 > autorite/serial
printf '1000\n' > autorite/crlnumber
```

Créez `autorite/openssl.cnf` :

```
[ ca ]
default_ca = CA_default
 
[ CA_default ]
dir = ./autorite
database = $dir/index.txt
new_certs_dir = $dir/newcerts
serial = $dir/serial
crlnumber = $dir/crlnumber
certificate = $dir/certificats/ca-intermediaire.crt
private_key = $dir/cles/ca-chartres.key
default_md = sha256
default_days = 90
default_crl_days = 7
policy = policy_server
copy_extensions = none
unique_subject = no
 
[ policy_server ]
countryName = optional
organizationName = optional
commonName = supplied
```
9) Émettre un nouveau certificat serveur

Nous reprenons le certificat `ca-chartres.csr`, puis nous créons `serveur/demandes/web.ext` en adaptant les noms DNS :

```
basicConstraints = critical, CA:FALSE
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always,issuer
subjectAltName = DNS:www.chartres.sportludique.fr,DNS:chartres.sportludique.fr
```

Puis, on signe avec le certificat intermédiaire :

```
openssl ca -config autorite/openssl.cnf \
  -in serveur/demandes/web.csr \
  -extfile serveur/demandes/web.ext \
  -out serveur/certificats/web-intermediaire.crt \
  -notext -days 200
```
Puis, nous vérifions la chaîne complète :

```
openssl verify -show_chain \
  -verify_hostname "www.ville.sportludique.fr" \
  -CAfile autorite/certificats/sportludique-root.crt.pem \
  -untrusted autorite/certificats/ca-intermediaire.crt \
  serveur/certificats/web-intermediaire.crt
```

Création du fichier `fullchain.pem` :

```
cat serveur/certificats/web-intermediaire.crt \
    autorite/certificats/ca-intermediaire.crt \
> serveur/certificats/fullchain.pem
```

Cette commande regroupe deux certificats publics dans un même fichier, dans l'ordre attendu par Apache.

### 7.6 - Publication du site en HTTPS sur Apache

1) Installation des certificats sur le serveur web

Sur le serveur Apache, nous préparons les dossiers de destination :

```
sudo mkdir -p /etc/ssl/sportludique/certs
sudo mkdir -p /etc/ssl/sportludique/private
```
Nous copions les fichiers nécessaires depuis le répertoire PKI vers ces dossiers : 

- `web.key` vers `/etc/ssl/sportludique/private/web.key` ;
 
- CA intermédiaire :`fullchain.pem` vers `/etc/ssl/sportludique/certs/fullchain.pem`.
 
Nous protégeons la clé privée sur le serveur web :

```
sudo chown root:root /etc/ssl/sportludique/private/web.key
sudo chmod 600 /etc/ssl/sportludique/private/web.key
```

Nous protégeons la clé privée sur le serveur web

2) Activer HTTPS

On active le module SSL : `sudo a2enmod ssl`

Nous créons le fichier `/etc/apache2/sites-avaibles/sportludique-ssl.conf`

Nous mettons la configuration suivante dans le fichier qui précède :


```
<VirtualHost *:443>
    ServerName www.chartres.sportludique.fr
    DocumentRoot /var/www/sportludique-public
 
    SSLEngine on
    SSLCertificateFile /etc/ssl/sportludique/certs/fullchain.pem
    SSLCertificateKeyFile /etc/ssl/sportludique/private/web.key
 
    <Directory /var/www/sportludique-public>
        Require all granted
</Directory>
</VirtualHost>
```

On active donc le site, nous testons la configuration et nous rechargeons Apache :

```
sudo a2ensite sportludique-ssl.conf
sudo apache2ctl configtest
sudo systemctl reload apache2
```


## 8 - Mise en place du serveur Mail (CHA-MAIL)
