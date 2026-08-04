import type { HandwerkerWebsite } from "@/types/website";
import ModernTemplate from "./templates/ModernTemplate";
import KlassischTemplate from "./templates/KlassischTemplate";
import MinimalTemplate from "./templates/MinimalTemplate";

export default function WebsiteRenderer({
  site,
  preview,
}: {
  site: HandwerkerWebsite;
  preview?: boolean;
}) {
  switch (site.template) {
    case "klassisch":
      return <KlassischTemplate site={site} preview={preview} />;
    case "minimalistisch":
      return <MinimalTemplate site={site} preview={preview} />;
    default:
      return <ModernTemplate site={site} preview={preview} />;
  }
}
