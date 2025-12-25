import svgPaths from "./svg-xmqudv4u8v";
import imgBasemapImage from "figma:asset/16679cb0b4116d921018915aff6402138e19535a.png";
import imgPixelpluginTmpnode from "figma:asset/41f23ca405025acc44aa205f51b861eea6248e9e.png";

function Group() {
  return (
    <div className="absolute inset-[8.33%]" data-name="Group">
      <div className="absolute inset-[-4%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 54 54">
          <g id="Group">
            <path d={svgPaths.p4d0e000} id="Vector" stroke="var(--stroke-0, #66D771)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
            <path d={svgPaths.p1a456a80} id="Vector_2" stroke="var(--stroke-0, #66D771)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function LucideWheat() {
  return (
    <div className="relative shrink-0 size-[60px]" data-name="lucide:wheat">
      <Group />
    </div>
  );
}

function Frame() {
  return (
    <div className="bg-[rgba(12,14,12,0.9)] h-[80px] relative rounded-[10px] shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center p-[10px] relative size-full">
          <LucideWheat />
        </div>
      </div>
    </div>
  );
}

function MdiLandFields() {
  return (
    <div className="relative shrink-0 size-[60px]" data-name="mdi:land-fields">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 60 60">
        <g id="mdi:land-fields">
          <path d={svgPaths.p2b7e1600} fill="var(--fill-0, #66D771)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame16() {
  return (
    <div className="bg-[rgba(12,14,12,0.9)] content-stretch flex h-[80px] items-center p-[10px] relative rounded-[10px] shrink-0">
      <MdiLandFields />
    </div>
  );
}

function IconoirSoil() {
  return (
    <div className="relative shrink-0 size-[60px]" data-name="iconoir:soil">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 60 60">
        <g id="iconoir:soil">
          <path d={svgPaths.p2a99b498} id="Vector" stroke="var(--stroke-0, #0C0E0C)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.9" strokeWidth="4" />
        </g>
      </svg>
    </div>
  );
}

function UilExport() {
  return (
    <div className="relative shrink-0 size-[60px]" data-name="uil:export">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 60 60">
        <g id="uil:export">
          <path d={svgPaths.p3a84a200} fill="var(--fill-0, #0C0E0C)" fillOpacity="0.9" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex flex-col gap-[40px] items-start relative shrink-0 w-[60px]">
      <IconoirSoil />
      <UilExport />
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex flex-col gap-[40px] items-center relative shrink-0">
      <Frame />
      <Frame16 />
      <Frame1 />
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute inset-[12.5%]" data-name="Group">
      <div className="absolute inset-[-4.44%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 49 49">
          <g id="Group">
            <path d={svgPaths.p19264d00} id="Vector" stroke="var(--stroke-0, #0C0E0C)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.9" strokeWidth="4" />
            <path d="M22 24.5H24.5V34.5H27" id="Vector_2" stroke="var(--stroke-0, #0C0E0C)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.9" strokeWidth="4" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function TablerInfoSquare() {
  return (
    <div className="relative shrink-0 size-[60px]" data-name="tabler:info-square">
      <Group1 />
    </div>
  );
}

function Frame2() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[585px] items-center left-[20px] top-[20px]">
      <Frame3 />
      <TablerInfoSquare />
    </div>
  );
}

function Figmap() {
  return (
    <div className="absolute contents left-[120px] top-0" data-name="Figmap">
      <div className="absolute h-[1080px] left-[120px] top-0 w-[1800px]" data-name="Basemap image">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute h-[229.92%] left-[-23.57%] max-w-none top-[-57.28%] w-[137.95%]" src={imgBasemapImage} />
        </div>
      </div>
      <div className="absolute h-[1080px] left-[123px] top-0 w-[1797px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1797 1080">
          <path d="M0 0H1797V1080H0V0Z" fill="var(--fill-0, black)" fillOpacity="0.2" id="Rectangle 4" />
        </svg>
      </div>
    </div>
  );
}

function MaterialSymbolsSearch() {
  return (
    <div className="relative shrink-0 size-[30.5px]" data-name="material-symbols:search">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 31 31">
        <g id="material-symbols:search">
          <path d={svgPaths.p39d46c00} fill="var(--fill-0, #B2B3B2)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-center p-[10px] relative shrink-0">
      <MaterialSymbolsSearch />
      <p className="font-['Roboto:Condensed_Medium',sans-serif] font-medium leading-[40px] relative shrink-0 text-[#b2b3b2] text-[31px] text-nowrap whitespace-pre" style={{ fontVariationSettings: "'wdth' 75" }}>
        Поиск
      </p>
    </div>
  );
}

function Frame5() {
  return (
    <div className="absolute bg-[rgba(12,14,12,0.9)] content-stretch flex flex-col h-[60px] items-start justify-center left-[1580px] rounded-[10px] top-[30px] w-[300px]">
      <Frame4 />
    </div>
  );
}

function IcBaselinePlus() {
  return (
    <div className="relative shrink-0 size-[30px]" data-name="ic:baseline-plus">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30 30">
        <g id="ic:baseline-plus">
          <path d={svgPaths.p1b7e84d2} fill="var(--fill-0, #B2B3B2)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame6() {
  return (
    <div className="content-stretch flex items-center relative shrink-0">
      <IcBaselinePlus />
    </div>
  );
}

function Frame7() {
  return (
    <div className="bg-[rgba(12,14,12,0.9)] content-stretch flex items-center p-[15px] relative rounded-[10px] shrink-0 size-[60px]">
      <Frame6 />
    </div>
  );
}

function IcBaselineMinus() {
  return (
    <div className="relative shrink-0 size-[30px]" data-name="ic:baseline-minus">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30 30">
        <g id="ic:baseline-minus">
          <path d={svgPaths.p14e05000} fill="var(--fill-0, #B2B3B2)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame8() {
  return (
    <div className="bg-[rgba(12,14,12,0.9)] content-stretch flex items-center p-[15px] relative rounded-[10px] shrink-0 size-[60px]">
      <IcBaselineMinus />
    </div>
  );
}

function Frame9() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0">
      <Frame7 />
      <Frame8 />
    </div>
  );
}

function Frame10() {
  return (
    <div className="absolute content-stretch flex flex-col h-[60px] items-center justify-center left-[1760px] rounded-[10px] top-[1000px] w-[120px]">
      <Frame9 />
    </div>
  );
}

function Frame11() {
  return (
    <div className="bg-[rgba(12,14,12,0.9)] h-[60px] relative rounded-[10px] shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[20px] items-center px-[20px] py-[15px] relative size-full">
          <div className="relative shrink-0 size-[30px]" data-name="Vector">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30 30">
              <path clipRule="evenodd" d={svgPaths.p2c286200} fill="var(--fill-0, #66D771)" fillRule="evenodd" id="Vector" />
            </svg>
          </div>
          <p className="font-['Roboto:Condensed_Medium',sans-serif] font-medium leading-[40px] relative shrink-0 text-[#66d771] text-[31px] text-nowrap whitespace-pre" style={{ fontVariationSettings: "'wdth' 75" }}>
            Слои карты
          </p>
        </div>
      </div>
    </div>
  );
}

function Frame13() {
  return (
    <div className="bg-[#131613] h-[60px] relative rounded-[10px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute border border-[#1d201d] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[25px] py-[10px] relative size-full">
          <p className="font-['Roboto:Condensed_Medium',sans-serif] font-medium leading-[40px] relative shrink-0 text-[20px] text-nowrap text-white whitespace-pre" style={{ fontVariationSettings: "'wdth' 75" }}>
            Культура
          </p>
        </div>
      </div>
    </div>
  );
}

function MaterialSymbolsArrowRightRounded() {
  return (
    <div className="relative shrink-0 size-[30px]" data-name="material-symbols:arrow-right-rounded">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30 30">
        <g id="material-symbols:arrow-right-rounded">
          <path d={svgPaths.p3a3c3d00} fill="var(--fill-0, #0C0E0C)" fillOpacity="0.9" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame18() {
  return (
    <div className="bg-[#2b8d35] h-[60px] relative rounded-[10px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute border border-[#1d201d] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[36px] items-center pl-[25px] pr-0 py-[10px] relative size-full">
          <p className="font-['Roboto:Condensed_Medium',sans-serif] font-medium leading-[40px] relative shrink-0 text-[20px] text-[rgba(12,14,12,0.9)] text-nowrap whitespace-pre" style={{ fontVariationSettings: "'wdth' 75" }}>
            Растительность
          </p>
          <MaterialSymbolsArrowRightRounded />
        </div>
      </div>
    </div>
  );
}

function MaterialSymbolsArrowRightRounded1() {
  return (
    <div className="relative shrink-0 size-[30px]" data-name="material-symbols:arrow-right-rounded">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30 30">
        <g id="material-symbols:arrow-right-rounded">
          <path d={svgPaths.p3a3c3d00} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame14() {
  return (
    <div className="bg-[#131613] h-[60px] relative rounded-[10px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute border border-[#1d201d] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[78px] items-center pl-[25px] pr-[27px] py-[10px] relative size-full">
          <p className="font-['Roboto:Condensed_Medium',sans-serif] font-medium leading-[40px] relative shrink-0 text-[20px] text-nowrap text-white whitespace-pre" style={{ fontVariationSettings: "'wdth' 75" }}>
            Влажность
          </p>
          <MaterialSymbolsArrowRightRounded1 />
        </div>
      </div>
    </div>
  );
}

function Frame15() {
  return (
    <div className="bg-[#131613] h-[60px] relative rounded-[10px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute border border-[#1d201d] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[25px] py-[10px] relative size-full">
          <p className="font-['Roboto:Condensed_Medium',sans-serif] font-medium leading-[40px] relative shrink-0 text-[21px] text-nowrap text-white whitespace-pre" style={{ fontVariationSettings: "'wdth' 75" }}>
            Удобрения
          </p>
        </div>
      </div>
    </div>
  );
}

function Frame17() {
  return (
    <div className="bg-[rgba(12,14,12,0.9)] content-stretch flex flex-col items-start relative rounded-[10px] shrink-0 w-full">
      <Frame13 />
      <Frame18 />
      <Frame14 />
      <Frame15 />
    </div>
  );
}

function Frame19() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[20px] items-start left-[160px] top-[30px] w-[240px]">
      <Frame11 />
      <Frame17 />
    </div>
  );
}

function Frame12() {
  return (
    <div className="bg-[#66d771] h-[60px] relative rounded-[10px] shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[25px] py-[10px] relative size-full">
          <p className="font-['Roboto:Condensed_Medium',sans-serif] font-medium leading-[40px] relative shrink-0 text-[20px] text-[rgba(12,14,12,0.9)] text-nowrap whitespace-pre" style={{ fontVariationSettings: "'wdth' 75" }}>
            NDVI
          </p>
        </div>
      </div>
    </div>
  );
}

function Frame23() {
  return (
    <div className="bg-[#131613] h-[60px] relative rounded-[10px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute border border-[#1d201d] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[25px] py-[10px] relative size-full">
          <p className="font-['Roboto:Condensed_Medium',sans-serif] font-medium leading-[40px] relative shrink-0 text-[20px] text-nowrap text-white whitespace-pre" style={{ fontVariationSettings: "'wdth' 75" }}>
            Средний NDVI
          </p>
        </div>
      </div>
    </div>
  );
}

function Frame24() {
  return (
    <div className="bg-[#131613] h-[60px] relative rounded-[10px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute border border-[#1d201d] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[25px] py-[10px] relative size-full">
          <p className="font-['Roboto:Condensed_Medium',sans-serif] font-medium leading-[40px] relative shrink-0 text-[20px] text-nowrap text-white whitespace-pre" style={{ fontVariationSettings: "'wdth' 75" }}>
            NDRE
          </p>
        </div>
      </div>
    </div>
  );
}

function Frame25() {
  return (
    <div className="bg-[#131613] h-[60px] relative rounded-[10px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute border border-[#1d201d] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[25px] py-[10px] relative size-full">
          <p className="font-['Roboto:Condensed_Medium',sans-serif] font-medium leading-[40px] relative shrink-0 text-[21px] text-nowrap text-white whitespace-pre" style={{ fontVariationSettings: "'wdth' 75" }}>
            PRI
          </p>
        </div>
      </div>
    </div>
  );
}

function Frame26() {
  return (
    <div className="absolute bg-[rgba(12,14,12,0.9)] content-stretch flex flex-col items-start left-[409px] rounded-[10px] top-[110px] w-[220px]">
      <Frame12 />
      <Frame23 />
      <Frame24 />
      <Frame25 />
    </div>
  );
}

function Frame20() {
  return (
    <div className="absolute bg-[rgba(12,14,12,0.9)] content-stretch flex h-[60px] items-center justify-center left-[875px] px-[19px] py-[8px] rounded-[10px] top-[999px] w-[170px]">
      <p className="font-['Roboto:Condensed_Medium',sans-serif] font-medium leading-[40px] relative shrink-0 text-[20px] text-center text-nowrap text-white whitespace-pre" style={{ fontVariationSettings: "'wdth' 75" }}>
        Площадь: 12 га.
      </p>
    </div>
  );
}

function Frame21() {
  return (
    <div className="content-stretch flex flex-col font-['Roboto:Condensed_Medium',sans-serif] font-medium gap-[104px] items-start leading-[40px] relative shrink-0 text-[20px] text-white w-[26px]">
      <p className="relative shrink-0 w-full" style={{ fontVariationSettings: "'wdth' 75" }}>
        1.0
      </p>
      <p className="relative shrink-0 w-full" style={{ fontVariationSettings: "'wdth' 75" }}>
        0.0
      </p>
    </div>
  );
}

function Frame22() {
  return (
    <div className="absolute bg-[rgba(12,14,12,0.9)] content-stretch flex gap-[20px] items-center left-[160px] px-[20px] py-0 rounded-[10px] top-[880px]">
      <div className="h-[160px] rounded-[10px] shrink-0 w-[20px]" style={{ backgroundImage: "linear-gradient(rgb(40, 159, 52) 0%, rgb(102, 215, 113) 17.308%, rgb(238, 255, 6) 46.635%, rgb(241, 182, 80) 68.75%, rgb(242, 57, 57) 88.462%, rgb(158, 18, 18) 99.99%)" }} />
      <Frame21 />
    </div>
  );
}

export default function Desktop() {
  return (
    <div className="bg-[#131613] relative size-full" data-name="Desktop - 4">
      <div className="absolute bg-[#66d771] h-[1080px] left-0 top-0 w-[120px]" />
      <Frame2 />
      <Figmap />
      <Frame5 />
      <Frame10 />
      <Frame19 />
      <Frame26 />
      <Frame20 />
      <Frame22 />
      <div className="absolute h-[294px] left-[875px] top-[412px] w-[211px]" data-name="_pixelplugin_tmpnode">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute h-full left-[-5.11%] max-w-none top-0 w-[105.08%]" src={imgPixelpluginTmpnode} />
        </div>
      </div>
      <div className="absolute h-[275px] left-[879.5px] top-[427.5px] w-[202px]">
        <div className="absolute inset-[-0.38%_-0.5%_-0.39%_-0.5%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 204 278">
            <path d={svgPaths.p22a84c00} id="Vector 2" stroke="var(--stroke-0, #FFFDFD)" strokeWidth="2" />
          </svg>
        </div>
      </div>
    </div>
  );
}