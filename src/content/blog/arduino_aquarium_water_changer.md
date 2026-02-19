---
title: "Automating aquarium water changing"
description: "DIY automated aquarium water changer using Arduino"
pubDate: "Oct 31 2017"
---

An aquarium is one of the most interesting additions to the home & office environment. However it can be laborious to maintain. A weekly/bi-weekly water change schedule is likely necessary in most aquariums to keep harmful toxin concentrations low. Water changes happen to be one of the most time-consuming tasks related to owning an aquarium, and can also be messy. In this article, I will discuss the various aspects of building a water management system, from a process control perspective, as well as the hardware and software aspects. This system is capable of maintaining a constant water level and replacing the water in the aquarium without any human intervention. Since it was put into operation over three months ago in my home, I have not done a single manual water change, and all my fishes - neon tetras, various guppies, and an otocinclus catfish - are well and alive.
This is not meant to be a step-by-step DIY guide, but rather intended to document the thought processes behind the design decisions. However, I will include a list of items, the source code, as well as the mesh files for 3D printing, so that anyone can duplicate or build a similar system.

## PROCESS CONTROL

No matter how your system is set up, you will need 3 things: fresh water source, water level control, and waste water drainage.

![process diagram](/images/blog/water_changer_fig1.jpg)

- Fresh water source: brings in fresh new water
- Waste water drainage: removes a portion of water from the aquarium that contains waste and toxin
- Water level control: regulates filling and draining water from the aquarium to maintain a constant water level.

#### FEEDING THE AQUARIUM: INLINE FILTRATION VS FRESH WATER RESERVOIR

Depending on what is available, one can either use inline filtration (such as a reverse osmosis system), or a holding tank (reservoir) of treated water as a reservoir to feed the aquarium, as shown in Figure 2 & 3 below.

![process diagram with RO filter](/images/blog/water_changer_fig2.jpg)

In this set-up, the city water is treated by a reverse osmosis filtration system to remove unwanted chemicals (such as chlorine and chloramine). The water addition action is executed by an inlet valve, which is controlled by the water level controller.
Alternatively, when a water filtration system is not available, it is common practice to use water conditioner to treat city tap water, before adding to the aquarium. The system would look similar to the following Figure 3.

![process diagram with water treatment](/images/blog/water_changer_fig3.jpg)

In this set-up, a separate water tank is used as freshwater reservoir and is filled with collected rain water, or tap water that has been treated with water conditioner (to remove heavy metals, chlorine and chloramine). A pump is used to transfer water from the freshwater reservoir into the aquarium. The pump is controlled by the aquarium's water level controller. There should be a low-level switch on the fresh water reservoir, so that when the reservoir is depleted, the inlet pump would not be run dry and risk burning out the pump. The short drawback of this system is that the user will be required to once a while fill the fresh water reservoir with treated water, or install additional automation equipment to maintain the freshwater reservoir level and dispensing water conditioner, as well as mixing of the two. A high-level switch would be added to the freshwater reservoir to ensure it does not overflow, and a peristaltic pump would be utilized for adding water conditioner, and a low-level switch would be used so that the transfer pump does not run dry.
In this article, I will be focusing on the first scenario, where a water filtration system is used to feed the aquarium (as shown in Figure 2). To put more detail into what is shown in Figure 2, Figure 4 below illustrates the equipment used in this system.

![](/images/blog/water_changer_fig4.jpg)

Figure 4 above illustrates the system that I have built, and this is the system I will cover in the rest of this article. It features the following:

##### REVERSE OSMOSIS FILTRATION

I used a readily available reverse osmosis filtration system found on Amazon used for drinking water purposes. One should make sure the reverse osmosis system has a re-mineralization stage which adds certain salts back into the water that are needed for healthy, long-term consumption.
INLET LOW PRESSURE SWITCH
Because the reverse osmosis filtration process is slow, there is usually a pressurized vessel that holds the filtered water as part of the reverse osmosis system. As the vessel is being depleted, the water pressure after the filter would decrease. A low-pressure switch can be used to interrupt the water change process and to a maintain minimum water pressure in the the reverse osmosis filter, so that it would not be completely depleted. This is useful when the reverse osmosis filtration system is being shared with other processes, such as feeding a fridge, ice maker, or drinking water (as this could be why you have a reverse osmosis filter in your home in the first place).

##### FLOW METER

Flow meter is utilized in this system to measure water usage and to meet preset targets of water change volumes. Common inexpensive flow meters made for coffee machines are available on eBay or Amazon. These meters usually consist of a turbine with a magnet. As the turbine spins around due to the flow of liquid through it, a pickup coil would sense the passing of the magnet. The pick up reading would be handled in the Arduino code.
INLET VALVES
The valves used in this system are 12 volt electric solenoid valves. These are normally closed valves so that if there is a power failure, the aquarium will stop filling. These valves are also available on eBay or Amazon. One thing to note is that they are likely directional, meaning they would hold pressure in one direction but not the other, so it is important that they are installed in the correct direction. Only one such valve is needed; I used two to provide some redundancy.

##### CHECK VALVE

A check valve is utilized in this system to prevent the back-flow of water from the aquarium to the reverse osmosis filtration system. This is unlikely to occur unless:
The water line runs into the aquarium below the water level, thereby creating a siphoning effect
The water supply (from the tap) to the reverse osmosis filter is low on pressure. This can occur if you have a water outage.
HIGH LEVEL FLOAT SENSOR/SWITCH
A float sensor is used to maintain water level in the aquarium. The float sensor typically consists of a floating magnet design, and would open a switch at high-level, and close a switch at low-level. These are usually made of plastic and can be cheaply acquired from eBay or Amazon.
HIGH-HIGH LEVEL WATER PROBE
This is a sensor that has two metal terminals. When there is electrical conduction between the two metal terminals (such as the case when water is shorting the terminals together), it would change one of Arduino's pin state. I made this from scratch out of a simple transistor and a couple of resisters, and the probe is basically just a pair of exposed wires. Keep in mind that electrolysis could take place when the two terminals of the probe is submerged in the aquarium water. Therefore the system should not be designed to rely on this sensor. As a redundancy, I incorporated this sensor above the float sensor so that it would only become activated when the float sensor fails.

##### DRAIN PUMP

A low-power 12 volt submersible pump is used for removing waste water from the aquarium. Note that there is a "stand pipe" attached to the outlet of the pump (as seen in Figure 4), this stand pipe is there to break the siphon effect so that it would stop draining water when the drain pump stops. The stand pipe may need to be pinched (restricted) so that the drain pump would actually be pumping water out of the aquarium rather than just circulating water through the stand pipe.

##### CONTROLLER

For this system, an Arduino Uno is all that is needed. However an Arduino Mega with more I/O pins may serve better if you wish to expand its capabilities in the future (ie. adding redundant water level detection, water leak sensing, additional reservoir control automation, user interface and display, connectivity, etc).

## ELECTRICAL

In this section, let's look at the electrical wiring aspect of getting everything to work together.

##### PRESSURE SWITCHES, FLOAT SENSORS/SWITCHES, & WATER PROBES

There is multiple ways to do this. Arduino is really an amazing micro processor. Using the built-in pull-up resisters, the control circuits can be extremely simple and all of the sensors can be directly wired to the Arduino's pins, as long as the internal pull-up resistor on those pins are enabled in Arduino's sketch:
pinMode(pin_number, INPUT_PULLUP);
Alternatively, you can use an external circuit to handle reading the switches and water probe, using something similar to what is shown below.

![switch circuit](/images/blog/water_changer_fig5.jpg)

This circuit is designed as a water-sensing probe. When the two probe terminals are shorted (by water), the Arduino pin state would be pulled down. This circuit also works with the low pressure switches and float switches - just connect the two terminals to the switch. When the switch is open, the Arduino pin state will be high, and vice versa.
Note: The above circuit works regardless of whether the Arduino's internal pull-up resistor is enabled or disabled. However, if you are connecting Arduino's pin directly to a switch or using as water probe, you must enable internal pull-up resistor.

##### VALVES & PUMPS

Both the valves and pumps being utilized in my project are made for a 12 volt source. Arduino can only output 5 volts at relatively low amp, and is not suitable for driving a large load. To drive external load, a common DIY way is using a TIP120 power Darlington transister. The wiring diagram is as shown below.

![driver circuit](/images/blog/water_changer_fig6.jpg)

Note: While TIP120 has been utilized in such a way by DIY'ers since the 1970s, it is not an efficient way of powering projects as the transistor itself consumes a relative large amount of power. I have a number of TIP120's lying around so I built my projects using these.

##### FLOW METER

Wiring of the flow meter is relatively simple. Typically, there are three wires from the flow meter: black connects to ground, red connects to 5V power, and yellow connects to one of Arduino's input pins.

##### POWER

To keep things simple, I used existing 12V and 5V wall adapters which I already have available, to power the 12V load devices and the Arduino, respectively. You may wish to build a power module which steps down 12V to 5V, which would only require one 12V power adapter.

## CONTROL LOGIC

In this section, I will explore the various modes this system can operate on (I call it "operating mode"), the control logic behind each operating mode, as well as the software aspects of interfacing with the hardware. All of these operating modes are designed to suit different applications.

#### TOP-OFF ONLY MODE

![top-off only mode](/images/blog/water_changer_fig7.png)

In Top-off Only mode, the level controller seeks to maintain the water level from falling below a designated level. This is useful in marine aquariums, where evaporation may cause changes in salinity.

#### CONTINUOUS MODE

![continuous mode](/images/blog/water_changer_fig8.png)

In this mode, the system continuously alternates between draining and filling of the aquarium, to maintain water level at the float switch. It is built on top of the controls of Top-Off Only mode, with the addition of a drain pump.

#### TARGET VOLUME MODE

![target volume mode](/images/blog/water_changer_fig9.png)

Target Volume Mode is a further extension of the Continuous Mode. A flow meter is utilized to keep track of how much water is being added to the tank. The system would essentially operate in Continuous Mode, until the water consumption meets a pre-set target. A daily scheduler would reset the water consumption number to zero at the same time each day.
There are some functions which are omitted from the diagrams above. For instance, you may wish to implement codes that check water pressure and redundancy high-high level switch, as well as codes that schedule recurring tasks and keep track of water consumption (see Code section).

## PUTTING IT ALL TOGETHER

Finally, let's get our hands dirty and actually build this system.

#### PARTS

All of the materials and parts can be easily obtained on the internet.

- Reverse osmosis water filtration system with reminimeralization stage
- Low pressure switch
- Flow meter
- 12V electric solenoid (normally closed) valves
- Check valve
- Float switch
- Submersible pump
- Arduino Uno, or Arduino Mega
- 1/4" push fit Tee
- 1/4" water line tubing (to be used as inlet)
- 1/4" soft vinyl water line (to be used as final inlet line to tank)
- 1/8" X 1/8" barb (to adapt 1/4" hard water line to 1/4" soft vinyl line)
- Silicone aquarium air tubing (to be used as drain hose)
- 1/8" barb to 1/4" male threaded adapter (for adapting drain hose to plumbing)
- Circuit board, wires, resistors, transistors, connectors, etc. (See Electrical section).

#### CIRCUIT BOARDS

![work-ing-progress circuit boards](/images/blog/water_changer_fig10.png)
![circuit board](/images/blog/water_changer_fig11.png)
![circuit board backside](/images/blog/water_changer_fig12.png)
![complted circuit board](/images/blog/water_changer_fig13.png)

I put three sets of 12V load driver circuits (Figure 6) and four sets of sensor switch circuits (Figure 5) on one circuit board. Because I am using an Arduino Uno board, I made the circuit board as an Arduino shield so it can be attached directly on top of the Arduino board. I am using external power supplies to supply 5V and 12V power to the Arduino and load driver circuit, respectively; but you can use just a 12V power supply if you can integrate a 12V to 5V step down circuit.

#### HARDWARE

##### DRAIN PUMP

![drain pump](/images/blog/water_changer_fig14.png)

#### FLOAT SENSOR

![float sensor](/images/blog/water_changer_fig15.png)

#### DRAIN PUMP, FLOAT SENSOR, WALL MOUNT, VALVES

![assembly](/images/blog/water_changer_fig16.png)

#### UNDER-SINK RO FILTRATION

![RO](/images/blog/water_changer_fig17.png)

#### AQUARIUM

![aquarium](/images/blog/water_changer_fig18.png)

To mount everything in place, I designed a few pieces in SolidWorks and printed them. The float sensor and drain pump are wall-mounted to the aquarium on a sliding mechanism, so that the height is adjustable.
The drain pump does not have to be mounted high on the wall, and can be left submerged in the aquarium, as long as the drain pipe plumbing has design considerations to stop siphoning (See Figure 4 drain layout). But in case the siphon breaker fails, mounting the drain pump in an elevated position prevents the aquarium from being siphoned down (and killing the fishes).
The fresh water fill line is attached to the float mounting piece, but it can be positioned anywhere in the tank. One consideration is also the siphoning effect of the line, should the inlet water pressure become lower than the hydro-static pressure of the water due to the relative position of the tank and water supply. I have a check valve (one-way valve) on the water inlet line, but I also keep the inlet just above the water level in the aquarium so that reverse-siphoning cannot possibly take place; this is even more crucial in

systems where the inlet freshwater goes through a holding tank (such as illustrated in Figure 3), as the holding tank may overflow from the aquarium water, reverse-siphoning.
The two exposed wires behind the float sensor (Figures 21 & 22) are the sensing wires acting as the high-high water level switch. These two wires are positioned slightly above the float and normally kept out of the water. Should the float switch fail and the water level reaches the sensing wires, the water changing system would enter an emergency shut-down sequence to ensure the aquarium does not overflow. Keep in mind that the water sensing probe essentially works by sending a small amount of electric current across, electrolysis may take place if they are submerged and may release toxic metallic elements into the water (at a very slow rate). Therefore, it is normally kept out of the water and only becomes activated in an emergency as a back-up to the float switch.
Solidworks 2016 was used for designing the hardware pieces, the files can be found in this (link)[https://github.com/oscarychen/3d-printing-projects/tree/master/Water%20Sensor%20Frame%20V2].

## CODE

Standard Arduino IDE is used to develop and test the code running the water changing system. The code can be found on (Github)[https://github.com/oscarychen/ArduinoWaterChanger].
The code posted is for the development board I have constructed, and will definitely need to be tested thoroughly. I have been using the target volume mode for the last 3 months without any issue. However, you do need to have a test plan in place, and will need to customize some of the parameters for your specific design. Use this code at your own risk.

## OTHER CONSIDERATIONS

#### USER INTERFACE

While it is not covered in this article, the code does have standard Arduino I2C LCD library implemented. When you attach the appropriate LCD display to the I2C connectors on the Arduino board, you will get some read-outs such as near-instantaneous flow rate, water consumption, etc.
I have also been working on (a layered menu system based on digital encoder)[https://github.com/oscarychen/Digital-Rotary-Encoder-Menu-for-Arduino]; this is only about 80% functional so I have not implemented it in this project.

#### WATER CONSERVATION

If you are using a reverse osmosis filtration system, consider improving its efficiency. In common household reverse osmosis filtration systems, there is a so-called Auto Shut-off Valve.

The shut-off valve is a passive valve that operates by pressure differential. When the pressure between the two sides of the valve is low, it would shut off flow. This valve essentially stops back-flushing of the reverse osmosis (RO) membrane when the water pressure in the storage tank reaches that of the feed water. However this can take very long since as the pressure increases in the storage tank, the filling of the tank slows down. The easiest solution to speed up this process and reduce the amount of back-flushing can be achieved by boosting the pressure filling the storage tank, by the use of a so-called permeate pump.

The permeate pump uses the pressure from the inlet (which is the city water pressure from the faucet), and work to boost the discharge water pressure into the storage tank.
Alternatively, you can also use an active control, such as an Arduino system with pressure sensors and valves to regulate the RO system actively.
Similarly, you can also consider using additional holding tanks to capture the RO back-flush waste water, as well as drain water from the aquarium, for other uses such as watering gardens. Such a holding tank can be controlled using a similar level control principle as described in this article for controlling the water level in the aquarium.
